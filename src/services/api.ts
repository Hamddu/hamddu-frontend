import { apiClient } from "../api/client";
import { Post, Comment } from "../store/postStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.hamddu.online";

export interface BoardCategory {
  id: string;
  label: string;
}

export interface Content {
  id: string;
  name: string;
  sourceVideoId: string | null;
  type: string;
  status: string;
  interests: string | null;
  sortOrder: number | null;
  imageUrl: string | null;
  activeImageUrl: string | null;
  pointApplyable: boolean;
  channel: { id: string; name: string } | null;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  author: { id: string; nickname: string };
  content: { id: string; name: string } | null;
  createdAt: string;
}

export interface XpWallet {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  nextLevelThreshold: number | null;
  levelLabel: string | null;
}

export interface PointsWallet {
  balance: number;
}

export interface WatchHistory {
  id: string;
  contentId: string;
  watchRate: number;
  lastWatchedTimestamp: string;
  totalDuration: number;
  createdAt: string;
  lastWatchedAt: string;
}

export interface LikeResult {
  boardId?: string;
  commentId?: string;
  likeCount: number;
  isLiked: boolean;
}

export type ReportReason = "spam" | "harassment" | "inappropriate" | "copyright" | "other";

export interface ReportPayload {
  reason: ReportReason;
  description?: string;
}

export interface DeviceTokenPayload {
  token: string;
  platform: "ios" | "android";
  provider?: "fcm" | "apns";
  deviceName?: string;
}

function unwrapList<T = any>(data: any): T[] {
  return Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
}

function normalizeMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function firstBodyImageUrl(body?: string): string | undefined {
  return body?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
}

function normalizeMedia(raw: any): any[] {
  const media = raw.media ?? raw.medias ?? raw.images ?? raw.imageUrls ?? raw.mediaUrls ?? [];
  const list = Array.isArray(media) ? media : [media];
  if (raw.imageUrl) list.push(raw.imageUrl);
  if (raw.thumbnailUrl) list.push(raw.thumbnailUrl);
  const bodyImageUrl = firstBodyImageUrl(raw.body);
  if (bodyImageUrl) list.push(bodyImageUrl);
  return list
    .map((item: any) =>
      typeof item === "string"
        ? { id: item, url: normalizeMediaUrl(item) }
        : {
            ...item,
            url: item?.url || item?.imageUrl || item?.thumbnailUrl || item?.path
              ? normalizeMediaUrl(item.url ?? item.imageUrl ?? item.thumbnailUrl ?? item.path)
              : undefined,
          },
    )
    .filter((item: any) => !!item.url);
}

function normalizePost(raw: any): Post {
  return {
    ...raw,
    category: raw.category
      ? {
          ...raw.category,
          name: raw.category.name ?? raw.category.label ?? "",
        }
      : null,
    commentCount: raw.commentCount ?? 0,
    viewCount: raw.viewCount,
    likedByMe: raw.likedByMe ?? raw.isLiked ?? false,
    media: normalizeMedia(raw),
  };
}

function normalizeComment(raw: any): Comment {
  return {
    ...raw,
    boardId: raw.boardId ?? raw.board?.id ?? "",
    likedByMe: raw.likedByMe ?? raw.isLiked ?? false,
    children: (raw.children ?? []).map(normalizeComment),
  };
}

export function countComments(comments: Comment[] = []): number {
  return comments.reduce(
    (total, comment) => total + 1 + countComments(comment.children),
    0,
  );
}

export const postsApi = {
  getPosts: async (categoryId?: string): Promise<Post[]> => {
    const params: Record<string, any> = { page: 1, limit: 20, sort: "latest" };
    if (categoryId) params.categoryId = categoryId;
    const res = await apiClient.get("/api/boards", { params });
    const posts = unwrapList(res.data).map(normalizePost);
    // ponytail: one request per post until the boards API returns total commentCount.
    return Promise.all(
      posts.map(async (post) => {
        const comments = await apiClient
          .get(`/api/boards/${post.id}/comments`)
          .then((response) => unwrapList(response.data).map(normalizeComment))
          .catch(() => []);
        return { ...post, commentCount: countComments(comments) };
      }),
    );
  },

  getPostById: async (id: string): Promise<Post | null> => {
    const res = await apiClient.get(`/api/boards/${id}`);
    return res.data ? normalizePost(res.data) : null;
  },

  addPost: async (post: { title: string; body: string; categoryId: string; mediaIds?: string[] }): Promise<Post> => {
    const res = await apiClient.post("/api/boards", post);
    return normalizePost(res.data);
  },

  deletePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/boards/${id}`);
  },

  likePost: async (id: string): Promise<LikeResult> => {
    const res = await apiClient.post(`/api/boards/${id}/like`);
    return res.data;
  },

  unlikePost: async (id: string): Promise<LikeResult> => {
    const res = await apiClient.delete(`/api/boards/${id}/like`);
    return res.data;
  },

  reportPost: async ({ postId, ...payload }: { postId: string } & ReportPayload): Promise<void> => {
    await apiClient.post(`/api/boards/${postId}/report`, payload);
  },
};

export const commentsApi = {
  getCommentsByPostId: async (postId: string): Promise<Comment[]> => {
    const res = await apiClient.get(`/api/boards/${postId}/comments`);
    return unwrapList(res.data).map(normalizeComment);
  },

  addComment: async (comment: { postId: string; body: string; parentId?: string }): Promise<Comment> => {
    const { postId, ...payload } = comment;
    const res = await apiClient.post(`/api/boards/${postId}/comments`, payload);
    return normalizeComment(res.data);
  },

  deleteComment: async ({ postId, commentId }: { postId: string; commentId: string }): Promise<void> => {
    await apiClient.delete(`/api/boards/${postId}/comments/${commentId}`);
  },

  likeComment: async ({ postId, commentId }: { postId: string; commentId: string }): Promise<LikeResult> => {
    const res = await apiClient.post(`/api/boards/${postId}/comments/${commentId}/like`);
    return res.data;
  },

  unlikeComment: async ({ postId, commentId }: { postId: string; commentId: string }): Promise<LikeResult> => {
    const res = await apiClient.delete(`/api/boards/${postId}/comments/${commentId}/like`);
    return res.data;
  },

  reportComment: async ({
    postId,
    commentId,
    ...payload
  }: { postId: string; commentId: string } & ReportPayload): Promise<void> => {
    await apiClient.post(`/api/boards/${postId}/comments/${commentId}/report`, payload);
  },
};

export const categoriesApi = {
  getCategories: async (): Promise<BoardCategory[]> => {
    const res = await apiClient.get("/api/boards/categories");
    return unwrapList(res.data);
  },
};

export const contentsApi = {
  getTutorials: async (): Promise<Content[]> => {
    const [knitting, crochet] = await Promise.all([
      apiClient.get("/api/contents/tutorials", { params: { interests: "knitting" } }),
      apiClient.get("/api/contents/tutorials", { params: { interests: "crochet" } }),
    ]);
    const knittingData: Content[] = Array.isArray(knitting.data) ? knitting.data : [];
    const crochetData: Content[] = Array.isArray(crochet.data) ? crochet.data : [];
return [...knittingData, ...crochetData];
  },
};

export interface ChallengeSubmitResult {
  id: string;
  pointEarned: number;
  xpEarned: number;
}

export const challengesApi = {
  getChallenges: async (): Promise<Challenge[]> => {
    const res = await apiClient.get("/api/challenges");
    return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  },
  getMyChallenges: async (): Promise<Challenge[]> => {
    const res = await apiClient.get("/api/challenges/my");
    return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  },
  submit: async (payload: {
    contentId: string;
    title?: string;
    body?: string;
    mediaId?: string;
  }): Promise<ChallengeSubmitResult> => {
    const res = await apiClient.post("/api/challenges", payload);
    return res.data;
  },
};

export const xpApi = {
  getWallet: async (): Promise<XpWallet> => {
    const res = await apiClient.get("/api/xp/wallet");
    return res.data;
  },
};

export const pointsApi = {
  getWallet: async (): Promise<PointsWallet> => {
    const res = await apiClient.get("/api/points/wallet");
    return res.data;
  },
};

export const notificationsApi = {
  registerDeviceToken: async (payload: DeviceTokenPayload): Promise<void> => {
    await apiClient.post("/api/notifications/device-tokens", payload);
  },
  unregisterDeviceToken: async (token: string): Promise<void> => {
    await apiClient.delete(`/api/notifications/device-tokens/${encodeURIComponent(token)}`);
  },
};

export const feedbacksApi = {
  create: async (body: string): Promise<void> => {
    await apiClient.post("/api/feedbacks", { body });
  },
};

export const nicknamesApi = {
  candidates: async (): Promise<string> => {
    const res = await apiClient.get("/api/nicknames/candidates");
    const list: string[] = Array.isArray(res.data) ? res.data : [];
    const pick = list[Math.floor(Math.random() * list.length)];
    if (!pick) throw new Error("닉네임 후보 없음");
    return pick;
  },

  check: async (nickname: string): Promise<boolean> => {
    const res = await apiClient.get("/api/nicknames/check", { params: { value: nickname } });
    return !res.data.isTaken;
  },

  register: async (nickname: string): Promise<void> => {
    await apiClient.post("/api/nicknames/register", { nickname });
  },
};

export const watchHistoryApi = {
  getAll: async (): Promise<WatchHistory[]> => {
    const res = await apiClient.get("/api/watch-history");
    const items: any[] = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
    return items.map((h) => ({
      ...h,
      contentId: h.contentId ?? h.content?.id,
    }));
  },

  save: async (payload: {
    contentId: string;
    totalDuration: number;
    lastWatchedTimestamp: string;
    watchRate: number;
  }): Promise<void> => {
    await apiClient.post("/api/watch-history", payload);
  },
};
