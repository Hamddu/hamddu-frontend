import { create } from "zustand";

export interface PostAuthor {
  id: string;
  nickname: string | null;
}

export interface PostCategory {
  id: string;
  name: string;
  label?: string;
}

export interface PostMedia {
  id: string;
  url: string;
  mimeType?: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  author: PostAuthor;
  category: PostCategory | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  media?: PostMedia[];
}

export interface Comment {
  id: string;
  boardId: string;
  body: string;
  author: PostAuthor;
  parentId: string | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  children?: Comment[];
}

interface PostStore {
  posts: Post[];
  addPost: (post: Post) => void;
  likePost: (id: string) => void;
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [],
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  likePost: (id) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id ? { ...p, likeCount: p.likeCount + 1, likedByMe: true } : p
      ),
    })),
}));
