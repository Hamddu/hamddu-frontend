import { create } from "zustand";

export interface Post {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  author: string;
  likes: number;
  createdAt: Date;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: Date;
}

interface PostStore {
  posts: Post[];
  addPost: (post: Omit<Post, "id" | "createdAt" | "likes">) => void;
  likePost: (id: string) => void;
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [
    {
      id: "1",
      title: "첫 번째 목도리 완성!",
      description:
        "겨울용 목도리를 드디어 완성했어요. 패턴은 기본 메리야스뜨기입니다.",
      imageUri:
        "https://images.unsplash.com/photo-1601924381111-5e0fd1d6df5d?w=800",
      author: "뜨개왕초보",
      likes: 15,
      createdAt: new Date("2024-01-01"),
      commentCount: 3,
    },
    {
      id: "2",
      title: "아기 모자 만들기",
      description: "조카 선물용으로 만든 아기 모자예요. 너무 귀엽지 않나요?",
      imageUri:
        "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800",
      author: "엄마손",
      likes: 32,
      createdAt: new Date("2024-01-02"),
      commentCount: 4,
    },
  ],

  addPost: (post) =>
    set((state) => ({
      posts: [
        {
          ...post,
          id: Date.now().toString(),
          createdAt: new Date(),
          likes: 0,
        },
        ...state.posts,
      ],
    })),

  likePost: (id) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === id ? { ...post, likes: post.likes + 1 } : post
      ),
    })),
}));
