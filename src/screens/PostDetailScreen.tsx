import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Alert,
  Share,
} from "react-native";
import { Text, TextInput, Button, Dialog, Portal, RadioButton } from "react-native-paper";
import RenderHtml from "react-native-render-html";
import { useRoute } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import type { RouteProp } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { usePost, useToggleLike } from "../hooks/usePosts";
import { useComments, useAddComment, useDeleteComment, useToggleCommentLike } from "../hooks/useComments";
import { CommunityStackParamList } from "../types/navigation";
import CommentItem from "../components/CommentItem";
import { getMyProfile } from "../api/users.api";
import { commentsApi, postsApi, ReportReason } from "../services/api";

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";
const WHITE = "#FFFFFF";
const SURFACE = "#F7F5F2";

type PostDetailRouteProp = RouteProp<CommunityStackParamList, "PostDetail">;
type ReportTarget = { type: "post"; id: string } | { type: "comment"; id: string };

const REPORT_REASONS: { label: string; value: ReportReason }[] = [
  { label: "스팸/광고", value: "spam" },
  { label: "욕설/비방", value: "harassment" },
  { label: "부적절한 콘텐츠", value: "inappropriate" },
  { label: "저작권 침해", value: "copyright" },
  { label: "기타", value: "other" },
];

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const d = Math.floor(diffMs / 86400000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  if (d < 7) return `${d}일 전`;
  const dt = new Date(dateStr);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "신고 접수에 실패했습니다.";
  return error.response?.data?.errorMessage ?? error.response?.data?.message ?? "신고 접수에 실패했습니다.";
}

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;
  const headerHeight = useHeaderHeight();

  const { data: post, isLoading: postLoading, isError: postError, refetch: refetchPost } = usePost(postId);
  const {
    data: comments,
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = useComments(postId);
  const { data: myProfile } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const { toggle: toggleLike } = useToggleLike();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleCommentLikeMutation = useToggleCommentLike();

  const { width: contentWidth } = useWindowDimensions();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDescription, setReportDescription] = useState("");

  const reportMutation = useMutation({
    mutationFn: ({ target, reason, description }: { target: ReportTarget; reason: ReportReason; description?: string }) =>
      target.type === "post"
        ? postsApi.reportPost({ postId: target.id, reason, description })
        : commentsApi.reportComment({ postId, commentId: target.id, reason, description }),
    onSuccess: () => {
      setReportTarget(null);
      setReportReason("spam");
      setReportDescription("");
      Alert.alert("신고 완료", "신고가 접수되었습니다.");
    },
    onError: (error) => {
      Alert.alert("신고 실패", getApiErrorMessage(error));
    },
  });

  const handleLikePress = () => {
    if (post) toggleLike(post);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(
      { postId, body: commentText, parentId: replyTo?.id },
      {
        onSuccess: () => {
          setCommentText("");
          setReplyTo(null);
        },
      },
    );
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert("댓글 삭제", "댓글을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteCommentMutation.mutate({ postId, commentId }),
      },
    ]);
  };

  const handleShare = async () => {
    await Share.share({
      title: post?.title ?? "함뜨 게시글",
      message: `${post?.title ?? "함뜨 게시글"}\n${stripHtml(post?.body ?? "")}`,
    });
  };

  const openReportDialog = (target: ReportTarget) => {
    setReportTarget(target);
    setReportReason("spam");
    setReportDescription("");
  };

  const submitReport = () => {
    if (!reportTarget) return;
    const description = reportDescription.trim();
    reportMutation.mutate({
      target: reportTarget,
      reason: reportReason,
      description: description || undefined,
    });
  };

  if (postLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (postError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>게시물을 불러오지 못했어요</Text>
        <Text style={styles.errorText}>잠시 후 다시 시도해주세요</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchPost()} activeOpacity={0.75}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>게시물을 찾을 수 없어요</Text>
        <Text style={styles.errorText}>삭제되었거나 접근할 수 없는 게시글이에요</Text>
      </View>
    );
  }

  const categoryName = post.category?.name ?? "";
  const authorName = post.author?.nickname ?? "익명";
  const avatarText = authorName.slice(0, 2);
  const media = (post as any).media ?? [];
  const tags = (post as any).tags ?? [];
  const authorMeta = [
    getTimeAgo(post.createdAt),
    typeof post.viewCount === "number" ? `조회 ${post.viewCount}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.articleCard}>
          <View style={styles.authorSection}>
            <View style={styles.authorLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarText}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
                <Text style={styles.authorMeta}>{authorMeta}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.headerReportBtn} onPress={() => openReportDialog({ type: "post", id: post.id })}>
              <Text style={styles.headerReportText}>신고</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bodySection}>
            {categoryName ? (
              <Text style={styles.categoryChip}>{categoryName}</Text>
            ) : null}
            <Text style={styles.postTitle}>{post.title}</Text>
            <RenderHtml
              contentWidth={contentWidth - 40}
              source={{ html: post.body }}
              baseStyle={styles.htmlBody}
            />

            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((tag: string, i: number) => (
                  <Text key={i} style={styles.tagText}>#{tag}</Text>
                ))}
              </View>
            )}
          </View>

          {media.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaContent}
            >
              {media.map((m: any, i: number) => (
                <Image
                  key={m.url ?? i}
                  source={{ uri: m.url ?? m }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.actionBar}>
            <TouchableOpacity onPress={handleLikePress} style={styles.actionBtn} activeOpacity={0.75}>
              <Text style={[styles.actionIcon, post.likedByMe && { color: PRIMARY }]}>
                {post.likedByMe ? "♥" : "♡"}
              </Text>
              <Text style={styles.actionCount}>{post.likeCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionCount}>{post.commentCount}</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.75}>
              <Text style={styles.actionLabel}>공유</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>댓글</Text>
            <Text style={styles.commentsCount}>{comments?.length || 0}</Text>
          </View>

          {commentsLoading ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : commentsError ? (
            <View style={styles.commentErrorBox}>
              <Text style={styles.errorTitle}>댓글을 불러오지 못했어요</Text>
              <Text style={styles.errorText}>잠시 후 다시 시도해주세요</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchComments()} activeOpacity={0.75}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : comments && comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={({ item }) => (
                <CommentItem
                  comment={item}
                  currentUser={myProfile?.nickname ?? ""}
                  onDelete={handleDeleteComment}
                  onLike={(comment) => toggleCommentLikeMutation.mutate({ postId, comment })}
                  onReply={(comment) =>
                    setReplyTo({
                      id: comment.id,
                      nickname: comment.author?.nickname ?? "익명",
                    })
                  }
                  onReport={(comment) => openReportDialog({ type: "comment", id: comment.id })}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noComments}>첫 댓글을 남겨보세요</Text>
          )}
        </View>
      </ScrollView>

      {/* 댓글 입력창 */}
      <View style={styles.commentInputContainer}>
        {replyTo && (
          <View style={styles.replyTargetRow}>
            <Text style={styles.replyTargetText}>@{replyTo.nickname}님에게 답글</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Text style={styles.replyCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.commentInputRow}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder={replyTo ? "답글을 남겨주세요..." : "따뜻한 댓글을 남겨주세요..."}
            mode="outlined"
            style={styles.commentInput}
            outlineColor={LINE}
            activeOutlineColor={PRIMARY}
            multiline
            maxLength={500}
            theme={{ colors: { onSurfaceVariant: INK3 } }}
          />
          <Button
            mode="contained"
            onPress={handleAddComment}
            loading={addCommentMutation.isPending}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            style={styles.submitButton}
            buttonColor={PRIMARY}
            labelStyle={styles.submitLabel}
          >
            전송
          </Button>
        </View>
      </View>

      <Portal>
        <Dialog visible={!!reportTarget} onDismiss={() => setReportTarget(null)}>
          <Dialog.Title>{reportTarget?.type === "post" ? "게시글 신고" : "댓글 신고"}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => setReportReason(value as ReportReason)}
              value={reportReason}
            >
              {REPORT_REASONS.map((reason) => (
                <RadioButton.Item
                  key={reason.value}
                  label={reason.label}
                  value={reason.value}
                  color={PRIMARY}
                  labelStyle={styles.reportReasonLabel}
                />
              ))}
            </RadioButton.Group>
            <TextInput
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="상세 내용을 입력해주세요. (선택)"
              mode="outlined"
              multiline
              maxLength={1000}
              style={styles.reportDescription}
              outlineColor={LINE}
              activeOutlineColor={PRIMARY}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReportTarget(null)} disabled={reportMutation.isPending}>
              취소
            </Button>
            <Button onPress={submitReport} loading={reportMutation.isPending} disabled={reportMutation.isPending}>
              신고
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WHITE,
  },
  errorText: {
    color: INK3,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  errorTitle: {
    color: INK1,
    fontSize: 15,
    fontWeight: "800",
  },
  retryButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 112,
  },
  articleCard: {
    backgroundColor: WHITE,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    overflow: "hidden",
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  authorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  headerReportBtn: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  headerReportText: {
    fontSize: 12,
    fontWeight: "800",
    color: INK3,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: PRIMARY_DEEP,
  },
  authorInfo: {
    marginLeft: 10,
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "800",
    color: INK1,
  },
  authorMeta: {
    fontSize: 11,
    fontWeight: "600",
    color: INK3,
    marginTop: 1,
  },
  bodySection: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
  },
  categoryChip: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY_DEEP,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: INK1,
    lineHeight: 28,
    marginBottom: 10,
  },
  htmlBody: {
    color: INK2,
    fontSize: 14,
    lineHeight: 23,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY_DEEP,
  },
  mediaContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  mediaImage: {
    width: 250,
    height: 188,
    borderRadius: 14,
    backgroundColor: SURFACE,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: LINE,
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: SURFACE,
    gap: 5,
  },
  actionIcon: {
    fontSize: 13,
    color: INK3,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: INK3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: INK3,
  },
  commentsSection: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: INK1,
  },
  commentsCount: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    backgroundColor: SURFACE,
    color: INK3,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 22,
  },
  noComments: {
    fontSize: 13,
    fontWeight: "600",
    color: INK3,
    textAlign: "center",
    paddingVertical: 36,
    backgroundColor: SURFACE,
    borderRadius: 16,
  },
  commentErrorBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    backgroundColor: SURFACE,
    borderRadius: 16,
  },
  commentInputContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: LINE,
    gap: 8,
  },
  replyTargetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  replyTargetText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
  },
  replyCancelText: {
    fontSize: 12,
    fontWeight: "700",
    color: INK3,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: SURFACE,
    fontSize: 13,
  },
  submitButton: {
    borderRadius: 20,
    marginBottom: 2,
  },
  submitLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  reportReasonLabel: {
    fontSize: 14,
    color: INK2,
  },
  reportDescription: {
    maxHeight: 120,
    marginTop: 8,
    backgroundColor: WHITE,
    fontSize: 13,
  },
});
