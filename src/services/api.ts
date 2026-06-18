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
}

export const postsApi = {
  getPosts: async (categoryId?: string): Promise<Post[]> => {
    const params: Record<string, any> = { page: 1, limit: 20, sort: "latest" };
    if (categoryId) params.categoryId = categoryId;
    const res = await apiClient.get("/api/boards", { params });
    return Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.items ?? []);
  },

  getPostsByAuthor: async (authorId: string): Promise<Post[]> => {
    const res = await apiClient.get("/api/boards", { params: { authorId } });
    return Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.items ?? []);
  },

  getPostById: async (id: string): Promise<Post | null> => {
    const res = await apiClient.get(`/api/boards/${id}`);
    return res.data;
  },

  addPost: async (post: { title: string; body: string; categoryId: string }): Promise<Post> => {
    const res = await apiClient.post("/api/boards", post);
    return res.data;
  },

  likePost: async (id: string): Promise<void> => {
    await apiClient.post(`/api/boards/${id}/like`);
  },

  unlikePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/boards/${id}/like`);
  },
};

export const commentsApi = {
  getCommentsByPostId: async (postId: string): Promise<Comment[]> => {
    const res = await apiClient.get(`/api/boards/${postId}/comments`);
    return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  },

  addComment: async (comment: { postId: string; body: string; parentId?: string }): Promise<Comment> => {
    const { postId, ...payload } = comment;
    const res = await apiClient.post(`/api/boards/${postId}/comments`, payload);
    return res.data;
  },

  deleteComment: async ({ postId, commentId }: { postId: string; commentId: string }): Promise<void> => {
    await apiClient.delete(`/api/boards/${postId}/comments/${commentId}`);
  },
};

export const categoriesApi = {
  getCategories: async (): Promise<BoardCategory[]> => {
    const res = await apiClient.get("/api/boards/categories");
    return Array.isArray(res.data) ? res.data : (res.data.data ?? res.data.items ?? []);
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

export const challengesApi = {
  getChallenges: async (): Promise<Challenge[]> => {
    const res = await apiClient.get("/api/challenges");
    return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  },
  getMyChallenges: async (): Promise<Challenge[]> => {
    const res = await apiClient.get("/api/challenges/my");
    return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
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
    return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
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
