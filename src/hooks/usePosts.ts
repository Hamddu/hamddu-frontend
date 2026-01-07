import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../services/api';
import { Post } from '../store/postStore';

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters?: string) => [...postKeys.lists(), { filters }] as const,
  byAuthor: (author: string) => [...postKeys.all, 'author', author] as const,
};

// Fetch all posts
export const usePosts = () => {
  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: postsApi.getPosts,
  });
};

// Fetch posts by author
export const usePostsByAuthor = (author: string) => {
  return useQuery({
    queryKey: postKeys.byAuthor(author),
    queryFn: () => postsApi.getPostsByAuthor(author),
    enabled: !!author,
  });
};

// Fetch single post by ID
export const usePost = (postId: string) => {
  return useQuery({
    queryKey: [...postKeys.all, postId],
    queryFn: () => postsApi.getPostById(postId),
    enabled: !!postId,
  });
};

// Add new post mutation
export const useAddPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.addPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

// Like post mutation
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.likePost,
    onMutate: async (postId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData<Post[]>(postKeys.lists());

      // Optimistically update
      queryClient.setQueryData<Post[]>(postKeys.lists(), (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );

      return { previousPosts };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.lists(), context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// Unlike post mutation
export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.unlikePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};
