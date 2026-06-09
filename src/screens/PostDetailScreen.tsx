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
} from "react-native";
import {
  Card,
  Text,
  IconButton,
  TextInput,
  Button,
  Avatar,
} from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { usePost, useLikePost } from "../hooks/usePosts";
import { useComments, useAddComment } from "../hooks/useComments";
import { CommunityStackParamList } from "../types/navigation";
import CommentItem from "../components/CommentItem";
import { getMyProfile } from "../api/users.api";

type PostDetailRouteProp = RouteProp<CommunityStackParamList, "PostDetail">;
type NavigationProp = NativeStackNavigationProp<CommunityStackParamList>;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { postId } = route.params;

  const { data: post, isLoading: postLoading } = usePost(postId);
  const { data: comments, isLoading: commentsLoading } = useComments(postId);
  const { data: myProfile } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const likeMutation = useLikePost();
  const addCommentMutation = useAddComment();

  const [commentText, setCommentText] = useState("");

  const handleLikePress = () => {
    if (post) {
      likeMutation.mutate(post.id);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    addCommentMutation.mutate(
      {
        postId,
        body: commentText,
      },
      {
        onSuccess: () => {
          setCommentText("");
        },
      }
    );
  };

  const handleAuthorPress = () => {
    if (post) {
      navigation.navigate("UserProfile", { authorName: post.author?.nickname ?? '익명' });
    }
  };

  if (postLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5A37A2" />
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.scrollView}>
        {/* 게시물 정보 */}
        <Card style={styles.postCard}>
          {/* 작성자 정보 */}
          <TouchableOpacity onPress={handleAuthorPress}>
            <Card.Content style={styles.authorSection}>
              <Avatar.Icon
                size={40}
                icon="account"
                style={styles.avatar}
                color="#FFFFFF"
              />
              <Text style={styles.authorName}>{post.author?.nickname ?? '익명'}</Text>
            </Card.Content>
          </TouchableOpacity>

          {/* 제목과 내용 */}
          <Card.Content>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.description}>{post.body}</Text>
          </Card.Content>

          {/* 좋아요 버튼 */}
          <Card.Content style={styles.actionSection}>
            <View style={styles.actionRow}>
              <IconButton
                icon={post.likedByMe ? "heart" : "heart-outline"}
                size={28}
                iconColor="#5A37A2"
                onPress={handleLikePress}
              />
              <Text style={styles.likes}>{post.likeCount}명이 좋아합니다</Text>
            </View>
          </Card.Content>
        </Card>

        {/* 댓글 섹션 */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            댓글 {comments?.length || 0}개
          </Text>

          {commentsLoading ? (
            <ActivityIndicator size="small" color="#5A37A2" />
          ) : comments && comments.length > 0 ? (
            <FlatList
              data={comments}
              renderItem={({ item }) => (
                <CommentItem comment={item} currentUser={myProfile?.nickname ?? ""} />
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
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder="댓글을 입력하세요"
          mode="outlined"
          style={styles.commentInput}
          outlineColor="#E0E0E0"
          activeOutlineColor="#5A37A2"
          multiline
          maxLength={500}
        />
        <Button
          mode="contained"
          onPress={handleAddComment}
          loading={addCommentMutation.isPending}
          disabled={!commentText.trim() || addCommentMutation.isPending}
          style={styles.submitButton}
          buttonColor="#5A37A2"
        >
          작성
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  errorText: {
    color: "#999999",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: 400,
    backgroundColor: "#E0E0E0",
  },
  postCard: {
    margin: 0,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  actionSection: {
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },
  likes: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  commentsSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  noComments: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    paddingVertical: 32,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    marginBottom: 4,
  },
});
