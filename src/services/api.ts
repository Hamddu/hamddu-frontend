import { apiClient } from "../api/client";
import { Post, Comment } from "../store/postStore";

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

function unwrapList<T = any>(data: any): T[] {
  return Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
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
    likedByMe: raw.likedByMe ?? raw.isLiked ?? false,
    media: raw.media ?? [],
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

export const postsApi = {
  getPosts: async (categoryId?: string): Promise<Post[]> => {
    const params: Record<string, any> = { page: 1, limit: 20, sort: "latest" };
    if (categoryId) params.categoryId = categoryId;
    const res = await apiClient.get("/api/boards", { params });
    return unwrapList(res.data).map(normalizePost);
  },

  getPostById: async (id: string): Promise<Post | null> => {
    const res = await apiClient.get(`/api/boards/${id}`);
    return res.data ? normalizePost(res.data) : null;
  },

  addPost: async (post: { title: string; body: string; categoryId: string; mediaIds?: string[] }): Promise<Post> => {
    const res = await apiClient.post("/api/boards", post);
    return normalizePost(res.data);
  },

  likePost: async (id: string): Promise<LikeResult> => {
    const res = await apiClient.post(`/api/boards/${id}/like`);
    return res.data;
  },

  unlikePost: async (id: string): Promise<LikeResult> => {
    const res = await apiClient.delete(`/api/boards/${id}/like`);
    return res.data;
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
