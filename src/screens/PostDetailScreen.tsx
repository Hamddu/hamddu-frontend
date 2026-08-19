import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Alert,
  Share,
  Modal,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import RenderHtml from "react-native-render-html";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDeletePost, usePost, useToggleLike } from "../hooks/usePosts";
import { useComments, useAddComment, useDeleteComment, useToggleCommentLike } from "../hooks/useComments";
import { CommunityStackParamList } from "../types/navigation";
import CommentItem from "../components/CommentItem";
import { getMyProfile } from "../api/users.api";
import { commentsApi, countComments, postsApi, ReportReason } from "../services/api";
import { getAvatarColors } from "../utils/avatarColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { postId } = route.params;
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const { data: post, isLoading: postLoading, isError: postError, isRefetching: postRefreshing, refetch: refetchPost } = usePost(postId);
  const {
    data: comments,
    isLoading: commentsLoading,
    isError: commentsError,
    isRefetching: commentsRefreshing,
    refetch: refetchComments,
  } = useComments(postId);
  const { data: myProfile } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const { toggle: toggleLike } = useToggleLike();
  const deletePostMutation = useDeletePost();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleCommentLikeMutation = useToggleCommentLike();

  const { width: contentWidth } = useWindowDimensions();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const totalCommentCount = comments ? countComments(comments) : (post?.commentCount ?? 0);

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
        onError: (error) => {
          const message = axios.isAxiosError(error)
            ? error.response?.data?.errorMessage ?? error.response?.data?.message
            : null;
          Alert.alert("댓글 등록 실패", message ?? "댓글을 등록하지 못했어요.");
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

  const handleDeletePost = () => {
    Alert.alert("게시글 삭제", "게시글을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deletePostMutation.mutate(postId, {
          onSuccess: () => navigation.goBack(),
          onError: () => Alert.alert("삭제 실패", "게시글을 삭제하지 못했어요."),
        }),
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
  const isMine = !!myProfile?.id && post.author?.id === myProfile.id;
  const avatarText = authorName.slice(0, 2);
  const avatarColors = getAvatarColors(post.author?.id ?? authorName);
  const media = ((post as any).media ?? []).filter((item: any) => !post.body.includes(item.url ?? item));
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
        onScrollBeginDrag={() => setPostMenuOpen(false)}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={postRefreshing || commentsRefreshing}
            onRefresh={() => {
              void Promise.all([refetchPost(), refetchComments()]);
            }}
            tintColor="#FF7325"
            colors={["#FF7325"]}
          />
        }
      >
        <View style={styles.articleCard}>
          <View style={styles.authorSection}>
            <View style={styles.authorLeft}>
              <View style={[styles.avatar, { backgroundColor: avatarColors.backgroundColor }]}>
                <Text style={[styles.avatarText, { color: avatarColors.color }]}>{avatarText}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
                <Text style={styles.authorMeta}>{authorMeta}</Text>
              </View>
            </View>
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
                  style={[styles.mediaImage, { width: contentWidth - 40 }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.actionBar}>
            <TouchableOpacity onPress={handleLikePress} style={styles.actionBtn} activeOpacity={0.75}>
              <Ionicons
                name={post.likedByMe ? "heart" : "heart-outline"}
                size={18}
                color={post.likedByMe ? PRIMARY : INK3}
              />
              <Text style={[styles.actionLabel, post.likedByMe && { color: PRIMARY }]}>좋아요</Text>
              <Text style={styles.actionCount}>{post.likeCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={17} color={INK3} />
              <Text style={styles.actionLabel}>댓글</Text>
              <Text style={styles.actionCount}>{totalCommentCount}</Text>
            </View>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setPostMenuOpen((open) => !open)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="게시글 메뉴"
            >
              <Ionicons name="ellipsis-vertical" size={20} color={INK2} />
            </TouchableOpacity>
            {postMenuOpen && (
              <View style={styles.postMenu}>
                <TouchableOpacity
                  style={styles.postMenuItem}
                  onPress={() => {
                    setPostMenuOpen(false);
                    void handleShare();
                  }}
                >
                  <Ionicons name="share-outline" size={18} color={INK2} />
                  <Text style={styles.postMenuText}>공유</Text>
                </TouchableOpacity>
                {isMine && (
                  <>
                    <View style={styles.postMenuDivider} />
                    <TouchableOpacity
                      style={styles.postMenuItem}
                      onPress={() => {
                        setPostMenuOpen(false);
                        navigation.navigate("AddPost", { postId: post.id });
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={INK2} />
                      <Text style={styles.postMenuText}>수정</Text>
                    </TouchableOpacity>
                  </>
                )}
                <View style={styles.postMenuDivider} />
                <TouchableOpacity
                  style={styles.postMenuItem}
                  disabled={deletePostMutation.isPending}
                  onPress={() => {
                    setPostMenuOpen(false);
                    if (isMine) handleDeletePost();
                    else openReportDialog({ type: "post", id: post.id });
                  }}
                >
                  <Ionicons
                    name={isMine ? "trash-outline" : "flag-outline"}
                    size={18}
                    color={isMine ? "#E5484D" : INK2}
                  />
                  <Text style={[styles.postMenuText, isMine && styles.postMenuDeleteText]}>
                    {isMine ? "삭제" : "신고"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>댓글</Text>
            <Text style={styles.commentsCount}>{totalCommentCount}</Text>
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
                  onReply={(comment, parentId) =>
                    setReplyTo({
                      id: parentId,
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
      <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
            placeholder={replyTo ? "포근한 답글 한 코 남겨주세요..." : "포근한 댓글 한 코 남겨주세요..."}
            mode="flat"
            style={styles.commentInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            multiline
            maxLength={500}
            theme={{ colors: { onSurfaceVariant: INK3 } }}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            style={[styles.submitButton, !commentText.trim() && styles.submitButtonDisabled]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="댓글 등록"
          >
            {addCommentMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={21} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={!!reportTarget} transparent animationType="slide" onRequestClose={() => setReportTarget(null)}>
        <KeyboardAvoidingView
          style={styles.reportBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setReportTarget(null)} activeOpacity={1} />
          <View style={styles.reportSheet}>
            <View style={styles.reportHandle} />
            <Text style={styles.reportTitle}>
              {reportTarget?.type === "post" ? "게시글을 신고할까요?" : "댓글을 신고할까요?"}
            </Text>
            <Text style={styles.reportSubtitle}>신고 사유를 선택해주세요.</Text>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.reportContent}>
              <View style={styles.reportReasons}>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={styles.reportReasonRow}
                    onPress={() => setReportReason(reason.value)}
                  >
                    <Text style={styles.reportReasonLabel}>{reason.label}</Text>
                    <View style={[styles.reportCheck, reportReason === reason.value && styles.reportCheckSelected]}>
                      {reportReason === reason.value && <Ionicons name="checkmark" size={15} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
                <TextInput
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  placeholder="상세 내용을 입력해주세요. (선택)"
                  mode="flat"
                  multiline
                  maxLength={1000}
                  style={styles.reportDescription}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                />
            </ScrollView>
            <View style={styles.reportActions}>
              <TouchableOpacity style={styles.reportCancelButton} onPress={() => setReportTarget(null)}>
                <Text style={styles.reportCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reportSubmitButton} onPress={submitReport} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.reportSubmitText}>신고하기</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 112,
  },
  articleCard: {
    backgroundColor: WHITE,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  authorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  categoryChip: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY_DEEP,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 14,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: INK1,
    lineHeight: 32,
    marginBottom: 16,
  },
  htmlBody: {
    color: INK2,
    fontSize: 16,
    lineHeight: 26,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  mediaImage: {
    height: 260,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: LINE,
    gap: 22,
    position: "relative",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    gap: 4,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: INK3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: INK3,
  },
  moreButton: {
    width: 36,
    height: 36,
    marginLeft: "auto",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  postMenu: {
    position: "absolute",
    right: 0,
    bottom: 54,
    width: 132,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: WHITE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 10,
  },
  postMenuItem: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  postMenuText: {
    fontSize: 14,
    fontWeight: "700",
    color: INK2,
  },
  postMenuDeleteText: {
    color: "#E5484D",
  },
  postMenuDivider: {
    height: 1,
    marginHorizontal: 12,
    backgroundColor: LINE,
  },
  commentsSection: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    borderTopWidth: 8,
    borderTopColor: "#F5F5F5",
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: INK1,
  },
  commentsCount: {
    minWidth: 16,
    height: 22,
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
    paddingHorizontal: 16,
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
    borderRadius: 22,
    overflow: "hidden",
  },
  submitButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 4,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#D8D8D8",
  },
  reportReasonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: INK2,
  },
  reportBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  reportSheet: {
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: WHITE,
  },
  reportHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D8D8D8",
    alignSelf: "center",
    marginBottom: 22,
  },
  reportTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    color: INK1,
  },
  reportSubtitle: {
    marginTop: 5,
    marginBottom: 18,
    fontSize: 14,
    color: INK3,
  },
  reportContent: {
    paddingBottom: 14,
  },
  reportReasons: {
    borderRadius: 16,
    backgroundColor: "#F7F8FA",
    overflow: "hidden",
  },
  reportReasonRow: {
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#D0D3D8",
    alignItems: "center",
    justifyContent: "center",
  },
  reportCheckSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  reportDescription: {
    minHeight: 92,
    maxHeight: 120,
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F7F8FA",
    fontSize: 14,
  },
  reportActions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4,
  },
  reportCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  reportCancelText: {
    fontSize: 15,
    fontWeight: "800",
    color: INK2,
  },
  reportSubmitButton: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  reportSubmitText: {
    fontSize: 15,
    fontWeight: "800",
    color: WHITE,
  },
});
