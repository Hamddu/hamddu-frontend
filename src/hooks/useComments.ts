import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "../services/api";
import { postKeys } from "./usePosts";
import { Comment } from "../store/postStore";

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

function updateCommentTree(
  comments: Comment[] | undefined,
  commentId: string,
  updater: (comment: Comment) => Comment,
): Comment[] | undefined {
  return comments?.map((comment) =>
    comment.id === commentId
      ? updater(comment)
      : { ...comment, children: updateCommentTree(comment.children, commentId, updater) },
  );
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentsApi.deleteComment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(variables.postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, comment }: { postId: string; comment: Comment }) =>
      comment.likedByMe
        ? commentsApi.unlikeComment({ postId, commentId: comment.id })
        : commentsApi.likeComment({ postId, commentId: comment.id }),
    onMutate: async ({ postId, comment }) => {
      const key = commentKeys.byPost(postId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Comment[]>(key);
      queryClient.setQueryData<Comment[]>(key, (old) =>
        updateCommentTree(old, comment.id, (c) => ({
          ...c,
          likedByMe: !c.likedByMe,
          likeCount: Math.max(0, c.likeCount + (c.likedByMe ? -1 : 1)),
        })),
      );
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentKeys.byPost(variables.postId), context.previous);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<Comment[]>(commentKeys.byPost(variables.postId), (old) =>
        updateCommentTree(old, data.commentId ?? "", (c) => ({
          ...c,
          likeCount: data.likeCount,
          likedByMe: data.isLiked,
        })),
      );
    },
  });
};
