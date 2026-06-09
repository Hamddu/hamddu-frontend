import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "../services/api";
import { postKeys } from "./usePosts";

export const commentKeys = {
  all: ["comments"] as const,
  byPost: (postId: string) => [...commentKeys.all, "post", postId] as const,
};

export const useComments = (postId: string) => {
  return useQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: () => commentsApi.getCommentsByPostId(postId),
    enabled: !!postId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentsApi.addComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(variables.postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentsApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};
