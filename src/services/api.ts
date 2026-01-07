import { Post, Comment } from "../store/postStore";

// Mock API delay to simulate network requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock posts data
let mockPosts: Post[] = [
  {
    id: "1",
    title: "첫 번째 목도리 완성!",
    description:
      "겨울용 목도리를 드디어 완성했어요. 패턴은 기본 메리야스뜨기입니다.",
    imageUri:
      "https://images.unsplash.com/photo-1601924381111-5e0fd1d6df5d?w=800",
    author: "뜨개왕초보",
    likes: 15,
    commentCount: 3,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    title: "아기 모자 만들기",
    description: "조카 선물용으로 만든 아기 모자예요. 너무 귀엽지 않나요?",
    imageUri:
      "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800",
    author: "엄마손",
    likes: 32,
    commentCount: 5,
    createdAt: new Date("2024-01-02"),
  },
];

// Mock comments data
let mockComments: Comment[] = [
  {
    id: "1",
    postId: "1",
    author: "뜨개마스터",
    content: "정말 멋지네요! 패턴 어디서 구하셨어요?",
    createdAt: new Date("2024-01-01T10:00:00"),
  },
  {
    id: "2",
    postId: "1",
    author: "털실사랑",
    content: "색상 조합이 너무 예뻐요!",
    createdAt: new Date("2024-01-01T11:30:00"),
  },
  {
    id: "3",
    postId: "1",
    author: "엄마손",
    content: "저도 하나 만들어보고 싶어요",
    createdAt: new Date("2024-01-01T14:20:00"),
  },
  {
    id: "4",
    postId: "2",
    author: "뜨개왕초보",
    content: "너무 귀여워요! 조카가 좋아하겠어요",
    createdAt: new Date("2024-01-02T09:15:00"),
  },
  {
    id: "5",
    postId: "2",
    author: "뜨개마스터",
    content: "아기 모자 만들기 정말 재미있죠!",
    createdAt: new Date("2024-01-02T10:45:00"),
  },
  {
    id: "6",
    postId: "2",
    author: "털실사랑",
    content: "실 굵기는 어떤 걸 쓰셨나요?",
    createdAt: new Date("2024-01-02T12:00:00"),
  },
  {
    id: "7",
    postId: "2",
    author: "초보뜨개러",
    content: "저도 만들어보고 싶은데 초보자도 가능할까요?",
    createdAt: new Date("2024-01-02T15:30:00"),
  },
  {
    id: "8",
    postId: "2",
    author: "엄마손",
    content: "초보자도 충분히 가능해요! 유튜브 영상 보면서 따라하면 됩니다 😊",
    createdAt: new Date("2024-01-02T16:00:00"),
  },
];

export const postsApi = {
  // Fetch all posts
  getPosts: async (): Promise<Post[]> => {
    await delay(500);
    return [...mockPosts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Fetch posts by author
  getPostsByAuthor: async (author: string): Promise<Post[]> => {
    await delay(300);
    return mockPosts.filter((post) => post.author === author);
  },

  // Fetch post by ID
  getPostById: async (id: string): Promise<Post | null> => {
    await delay(200);
    return mockPosts.find((post) => post.id === id) || null;
  },

  // Add new post
  addPost: async (
    post: Omit<Post, "id" | "createdAt" | "likes" | "commentCount">
  ): Promise<Post> => {
    await delay(700);
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      createdAt: new Date(),
      likes: 0,
      commentCount: 0,
    };
    mockPosts = [newPost, ...mockPosts];
    return newPost;
  },

  // Like a post
  likePost: async (id: string): Promise<Post> => {
    await delay(300);
    const post = mockPosts.find((p) => p.id === id);
    if (!post) {
      throw new Error("Post not found");
    }
    post.likes += 1;
    return post;
  },

  // Unlike a post
  unlikePost: async (id: string): Promise<Post> => {
    await delay(300);
    const post = mockPosts.find((p) => p.id === id);
    if (!post) {
      throw new Error("Post not found");
    }
    post.likes = Math.max(0, post.likes - 1);
    return post;
  },
};

export const commentsApi = {
  // Fetch comments by post ID
  getCommentsByPostId: async (postId: string): Promise<Comment[]> => {
    await delay(300);
    return mockComments
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Add new comment
  addComment: async (
    comment: Omit<Comment, "id" | "createdAt">
  ): Promise<Comment> => {
    await delay(500);
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    mockComments = [newComment, ...mockComments];

    // Increment post's commentCount
    const post = mockPosts.find((p) => p.id === comment.postId);
    if (post) {
      post.commentCount += 1;
    }

    return newComment;
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<void> => {
    await delay(300);
    const comment = mockComments.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    mockComments = mockComments.filter((c) => c.id !== commentId);

    // Decrement post's commentCount
    const post = mockPosts.find((p) => p.id === comment.postId);
    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
    }
  },
};
