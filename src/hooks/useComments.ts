import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "../services/api";
import { Comment } from "../store/postStore";
import { postKeys } from "./usePosts";

// Query keys
export const commentKeys = {
  all: ["comments"] as const,
  byPost: (postId: string) => [...commentKeys.all, "post", postId] as const,
};

// Fetch comments by post ID
export const useComments = (postId: string) => {
  return useQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: () => commentsApi.getCommentsByPostId(postId),
    enabled: !!postId,
  });
};

// Add new comment
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: commentsApi.addComment,
    onMutate: async (newComment) => {
      // Optimistic Update
      const postId = newComment.postId;
      await queryClient.cancelQueries({ queryKey: commentKeys.byPost(postId) });

      const previousComments = queryClient.getQueryData<Comment[]>(
        commentKeys.byPost(postId)
      );

      // Optimistically update comments list
      queryClient.setQueryData<Comment[]>(
        commentKeys.byPost(postId),
        (old = []) => [
          {
            ...newComment,
            id: "temp-" + Date.now(),
            createdAt: new Date(),
          } as Comment,
          ...old,
        ]
      );

      return { previousComments, postId };
    },
    onError: (err, newComment, context) => {
      // Rollback on error
      if (context?.previousComments && context?.postId) {
        queryClient.setQueryData(
          commentKeys.byPost(context.postId),
          context.previousComments
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.byPost(variables.postId),
      });
      // Invalidate posts list to update commentCount
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

// Delete comment
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
