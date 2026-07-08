import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Comment } from "../store/postStore";

const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const LINE = "#ECECEC";

interface CommentItemProps {
  comment: Comment;
  currentUser?: string;
  onDelete?: (commentId: string) => void;
  onLike?: (comment: Comment) => void;
  onReply?: (comment: Comment) => void;
  depth?: number;
}

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

export default function CommentItem({
  comment,
  currentUser = "",
  onDelete,
  onLike,
  onReply,
  depth = 0,
}: CommentItemProps) {
  const authorName = comment.author?.nickname ?? "익명";
  const isOwner = authorName === currentUser;
  const timeAgo = getTimeAgo(comment.createdAt);
  const [showReplies, setShowReplies] = useState(depth === 0);
  const children = comment.children ?? [];
  const hasReplies = children.length > 0;

  return (
    <View style={[styles.container, depth > 0 && { paddingLeft: 44 }]}>
      {/* 아바타 */}
      <View style={[styles.avatar, depth > 0 && styles.childAvatar]}>
        <Text style={[styles.avatarText, depth > 0 && styles.childAvatarText]}>
          {authorName.slice(0, 2)}
        </Text>
      </View>

      <View style={styles.content}>
        {/* 작성자 + 시간 */}
        <View style={styles.header}>
          <Text style={[styles.author, depth > 0 && styles.childAuthor]}>{authorName}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
          {isOwner && onDelete && (
            <TouchableOpacity onPress={() => onDelete(comment.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 댓글 내용 */}
        <Text style={styles.text}>{comment.body}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.likeBtn} onPress={() => onLike?.(comment)}>
            <Text style={[styles.likeIcon, comment.likedByMe && { color: PRIMARY }]}>
              {comment.likedByMe ? "♥" : "♡"}
            </Text>
            <Text style={styles.likeCount}>{comment.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onReply?.(comment)}>
            <Text style={styles.replyText}>답글 달기</Text>
          </TouchableOpacity>
        </View>

        {hasReplies && (
          <TouchableOpacity
            style={styles.viewRepliesBtn}
            onPress={() => setShowReplies((show) => !show)}
          >
            <View style={styles.repliesLine} />
            <Text style={styles.viewRepliesText}>
              답글 {children.length}개 {showReplies ? "접기" : "보기"}
            </Text>
          </TouchableOpacity>
        )}

        {showReplies && children.map((child) => (
          <CommentItem
            key={child.id}
            comment={child}
            currentUser={currentUser}
            onDelete={onDelete}
            onLike={onLike}
            onReply={onReply}
            depth={depth + 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: PRIMARY,
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  childAvatarText: {
    fontSize: 9,
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 6,
  },
  author: {
    fontSize: 13,
    fontWeight: "700",
    color: INK1,
  },
  childAuthor: {
    fontSize: 12,
  },
  time: {
    fontSize: 11,
    color: INK3,
  },
  deleteBtn: {
    marginLeft: "auto",
  },
  deleteText: {
    fontSize: 11,
    color: INK3,
  },
  text: {
    fontSize: 14,
    color: INK2,
    lineHeight: 20,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  likeIcon: {
    fontSize: 11,
    color: INK3,
  },
  likeCount: {
    fontSize: 11,
    fontWeight: "600",
    color: INK3,
  },
  replyText: {
    fontSize: 11,
    fontWeight: "600",
    color: INK3,
  },
  viewRepliesBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  repliesLine: {
    width: 16,
    height: 1,
    backgroundColor: LINE,
  },
  viewRepliesText: {
    fontSize: 11,
    fontWeight: "600",
    color: PRIMARY,
  },
});
