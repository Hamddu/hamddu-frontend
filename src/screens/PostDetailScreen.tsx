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
import { Text, TextInput, Button, Avatar } from "react-native-paper";
import RenderHtml from "react-native-render-html";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { usePost, useToggleLike } from "../hooks/usePosts";
import { useComments, useAddComment, useDeleteComment, useToggleCommentLike } from "../hooks/useComments";
import { CommunityStackParamList } from "../types/navigation";
import CommentItem from "../components/CommentItem";
import { getMyProfile } from "../api/users.api";

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";
const WHITE = "#FFFFFF";

type PostDetailRouteProp = RouteProp<CommunityStackParamList, "PostDetail">;

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

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;

  const { data: post, isLoading: postLoading } = usePost(postId);
  const { data: comments, isLoading: commentsLoading } = useComments(postId);
  const { data: myProfile } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const { toggle: toggleLike } = useToggleLike();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleCommentLikeMutation = useToggleCommentLike();

  const { width: contentWidth } = useWindowDimensions();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);

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

  if (postLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const categoryName = post.category?.name ?? "";
  const authorName = post.author?.nickname ?? "익명";
  const media = (post as any).media ?? [];
  const tags = (post as any).tags ?? [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.scrollView}>
        {/* 카테고리 */}
        {categoryName ? (
          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>{categoryName}</Text>
          </View>
        ) : null}

        {/* 작성자 영역 */}
        <View style={styles.authorSection}>
          <View style={styles.authorLeft}>
            <Avatar.Icon
              size={40}
              icon="account"
              style={styles.avatar}
              color={WHITE}
            />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{authorName}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv.7</Text>
                </View>
              </View>
              <Text style={styles.authorMeta}>{getTimeAgo(post.createdAt)} · 조회 {(post as any).viewCount ?? 132}</Text>
            </View>
          </View>
        </View>

        {/* 게시글 본문 영역 */}
        <View style={styles.bodySection}>
          <Text style={styles.categoryChip}>{categoryName}</Text>
          <Text style={styles.postTitle}>{post.title}</Text>
          <RenderHtml
            contentWidth={contentWidth - 40}
            source={{ html: post.body }}
            baseStyle={styles.htmlBody}
          />

          {/* 태그 */}
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag: string, i: number) => (
                <Text key={i} style={styles.tagText}>#{tag}</Text>
              ))}
            </View>
          )}
        </View>

        {/* 미디어 이미지 */}
        {media.length > 0 && (
          <ScrollView
            horizontal
            style={styles.mediaScroll}
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

        {/* 액션 바 */}
        <View style={styles.actionBar}>
          <TouchableOpacity onPress={handleLikePress} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, post.likedByMe && { color: PRIMARY }]}>
              {post.likedByMe ? "♥" : "♡"}
            </Text>
            <Text style={styles.actionCount}>{post.likeCount}</Text>
          </TouchableOpacity>
          <View style={styles.actionBtn}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.commentCount}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Text style={styles.actionIcon}>⋮</Text>
            <Text style={styles.actionLabel}>공유</Text>
          </TouchableOpacity>
        </View>

        {/* 댓글 섹션 */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            댓글 {comments?.length || 0}
          </Text>

          {commentsLoading ? (
            <ActivityIndicator size="small" color={PRIMARY} />
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
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noComments}>
              첫 댓글을 남겨보세요!
            </Text>
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
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  categorySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: INK1,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  authorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    backgroundColor: PRIMARY_SOFT,
  },
  authorInfo: {
    marginLeft: 10,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "800",
    color: INK1,
  },
  levelBadge: {
    backgroundColor: PRIMARY_SOFT,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "800",
    color: PRIMARY,
  },
  authorMeta: {
    fontSize: 11,
    fontWeight: "400",
    color: INK3,
    marginTop: 1,
  },
  bodySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryChip: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 6,
  },
  postTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: INK1,
    lineHeight: 27.3,
    marginBottom: 10,
  },
  htmlBody: {
    color: INK2,
    fontSize: 14,
    lineHeight: 23.1,
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
  mediaScroll: {
    marginTop: 4,
  },
  mediaContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  mediaImage: {
    width: 268,
    height: 200,
    borderRadius: 10,
    backgroundColor: WHITE,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    fontWeight: "600",
    color: INK3,
  },
  commentsSection: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: INK1,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  noComments: {
    fontSize: 14,
    color: INK3,
    textAlign: "center",
    paddingVertical: 32,
  },
  commentInputContainer: {
    paddingHorizontal: 12,
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
    backgroundColor: WHITE,
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
});
