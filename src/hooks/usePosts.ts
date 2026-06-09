import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../services/api';
import { Post } from '../store/postStore';

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (categoryId?: string) => [...postKeys.lists(), { categoryId }] as const,
  byAuthor: (authorId: string) => [...postKeys.all, 'author', authorId] as const,
  detail: (id: string) => [...postKeys.all, id] as const,
};

export const usePosts = (categoryId?: string) => {
  return useQuery({
    queryKey: postKeys.list(categoryId),
    queryFn: () => postsApi.getPosts(categoryId),
  });
};

export const usePostsByAuthor = (authorId: string) => {
  return useQuery({
    queryKey: postKeys.byAuthor(authorId),
    queryFn: () => postsApi.getPostsByAuthor(authorId),
    enabled: !!authorId,
  });
};

export const usePost = (postId: string) => {
  return useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => postsApi.getPostById(postId),
    enabled: !!postId,
  });
};

export const useAddPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postsApi.addPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postsApi.likePost,
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });
      const previousPosts = queryClient.getQueryData<Post[]>(postKeys.lists());
      queryClient.setQueryData<Post[]>(postKeys.lists(), (old) =>
        old?.map((p) =>
          p.id === postId ? { ...p, likeCount: p.likeCount + 1, likedByMe: true } : p
        )
      );
      return { previousPosts };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.lists(), context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postsApi.unlikePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};
