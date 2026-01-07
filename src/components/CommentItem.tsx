import React from "react";
import { View, StyleSheet } from "react-native";
import { Avatar, Text, IconButton } from "react-native-paper";
import { Comment } from "../store/postStore";

interface CommentItemProps {
  comment: Comment;
  currentUser?: string;
  onDelete?: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  currentUser = "뜨개왕초보",
  onDelete,
}: CommentItemProps) {
  const isOwner = comment.author === currentUser;
  const timeAgo = getTimeAgo(comment.createdAt);

  return (
    <View style={styles.container}>
      <Avatar.Icon
        size={36}
        icon="account"
        style={styles.avatar}
        color="#FFFFFF"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.author}>{comment.author}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        <Text style={styles.text}>{comment.content}</Text>
      </View>
      {isOwner && onDelete && (
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor="#999999"
          onPress={() => onDelete(comment.id)}
        />
      )}
    </View>
  );
}

// 시간 차이를 계산하는 헬퍼 함수
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  // 날짜 표시
  const dateObj = new Date(date);
  return `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  avatar: {
    backgroundColor: "#5A37A2",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: "#999999",
  },
  text: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
});
