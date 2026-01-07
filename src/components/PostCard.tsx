import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Card, Avatar, IconButton, Text } from "react-native-paper";
import { Post } from "../store/postStore";

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onAuthorPress: () => void;
  onLikePress: () => void;
  onCommentPress: () => void;
}

export default function PostCard({
  post,
  onPress,
  onAuthorPress,
  onLikePress,
  onCommentPress,
}: PostCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLikePress = () => {
    // 애니메이션 효과
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onLikePress();
  };

  return (
    <Card style={styles.card}>
      {/* 작성자 정보 */}
      <TouchableOpacity onPress={onAuthorPress}>
        <Card.Content style={styles.header}>
          <View style={styles.authorRow}>
            <Avatar.Icon
              size={40}
              icon="account"
              style={styles.avatar}
              color="#FFFFFF"
            />
            <Text style={styles.authorName}>{post.author}</Text>
          </View>
        </Card.Content>
      </TouchableOpacity>

      {/* 이미지 */}
      <TouchableOpacity onPress={onPress}>
        <Card.Cover source={{ uri: post.imageUri }} style={styles.image} />
      </TouchableOpacity>

      {/* 액션 버튼 */}
      <Card.Content style={styles.actions}>
        <View style={styles.actionButtons}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <IconButton
              icon="heart"
              size={28}
              iconColor="#5A37A2"
              onPress={handleLikePress}
            />
          </Animated.View>
          <IconButton
            icon="comment-outline"
            size={28}
            iconColor="#5A37A2"
            onPress={onCommentPress}
          />
        </View>
        <Text style={styles.likes}>{post.likes}명이 좋아합니다</Text>
      </Card.Content>

      {/* 내용 */}
      <TouchableOpacity onPress={onPress}>
        <Card.Content>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {post.description}
          </Text>
          {post.commentCount > 0 && (
            <Text style={styles.commentCount}>
              댓글 {post.commentCount}개 모두 보기
            </Text>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    paddingVertical: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#5A37A2",
  },
  authorName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  image: {
    height: 300,
  },
  actions: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },
  likes: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  commentCount: {
    fontSize: 14,
    color: "#999999",
    marginTop: 8,
  },
});
