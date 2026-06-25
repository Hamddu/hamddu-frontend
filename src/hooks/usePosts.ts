import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from "axios";
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
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      const previousLists = queryClient.getQueriesData<Post[]>({ queryKey: postKeys.lists() });
      const previousDetail = queryClient.getQueryData<Post>(postKeys.detail(postId));
      queryClient.setQueriesData<Post[]>({ queryKey: postKeys.lists() }, (old) =>
        old?.map((p) =>
          p.id === postId ? { ...p, likeCount: p.likeCount + 1, likedByMe: true } : p
        )
      );
      queryClient.setQueryData<Post>(postKeys.detail(postId), (old) =>
        old ? { ...old, likeCount: old.likeCount + 1, likedByMe: true } : old
      );
      return { previousLists, previousDetail };
    },
    onError: (err, postId, context) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        queryClient.setQueryData<Post>(postKeys.detail(postId), (old) =>
          old ? { ...old, likedByMe: true } : old
        );
        queryClient.setQueriesData<Post[]>({ queryKey: postKeys.lists() }, (old) =>
          old?.map((p) =>
            p.id === postId ? { ...p, likedByMe: true } : p
          )
        );
        return;
      }
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousDetail);
      }
    },
    onSuccess: (data, postId) => {
      queryClient.setQueryData<Post>(postKeys.detail(postId), (old) =>
        old ? { ...old, likeCount: data.likeCount, likedByMe: data.isLiked } : old
      );
      queryClient.setQueriesData<Post[]>({ queryKey: postKeys.lists() }, (old) =>
        old?.map((p) =>
          p.id === postId ? { ...p, likeCount: data.likeCount, likedByMe: data.isLiked } : p
        )
      );
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postsApi.unlikePost,
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      const previousLists = queryClient.getQueriesData<Post[]>({ queryKey: postKeys.lists() });
      const previousDetail = queryClient.getQueryData<Post>(postKeys.detail(postId));
      queryClient.setQueriesData<Post[]>({ queryKey: postKeys.lists() }, (old) =>
        old?.map((p) =>
          p.id === postId ? { ...p, likeCount: p.likeCount - 1, likedByMe: false } : p
        )
      );
      queryClient.setQueryData<Post>(postKeys.detail(postId), (old) =>
        old ? { ...old, likeCount: old.likeCount - 1, likedByMe: false } : old
      );
      return { previousLists, previousDetail };
    },
    onError: (err, postId, context) => {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        queryClient.setQueryData<Post>(postKeys.detail(postId), (old) =>
          old ? { ...old, likedByMe: false } : old
        );
        queryClient.setQueriesData<Post[]>({ queryKey: postKeys.lists() }, (old) =>
          old?.map((p) =>
            p.id === postId ? { ...p, likedByMe: false } : p
          )
        );
        return;
      }
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousDetail);
      }
    },
    onSuccess: (data, postId) => {
      queryClient.setQueryData<Post>(postKeys.detail(postId), (old) =>
        old ? { ...old, likeCount: data.likeCount, likedByMe: data.isLiked } : old
      );
      queryClient.setQueriesData<Post[]>({ queryKey: postKeys.lists() }, (old) =>
        old?.map((p) =>
          p.id === postId ? { ...p, likeCount: data.likeCount, likedByMe: data.isLiked } : p
        )
      );
    },
  });
};

export const useToggleLike = () => {
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const toggle = (post: Post) => {
    if (post.likedByMe) {
      unlikeMutation.mutate(post.id);
    } else {
      likeMutation.mutate(post.id);
    }
  };
  return { toggle, isPending: likeMutation.isPending || unlikeMutation.isPending };
};
