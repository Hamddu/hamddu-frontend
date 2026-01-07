import React from "react";
import { FlatList, StyleSheet, View, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePosts, useLikePost } from "../hooks/usePosts";
import { Post } from "../store/postStore";
import { HomeStackParamList } from "../types/navigation";
import PostCard from "../components/PostCard";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data: posts, isLoading, error } = usePosts();
  const likeMutation = useLikePost();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5A37A2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>데이터를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const handlePostPress = (postId: string) => {
    navigation.navigate("PostDetail", { postId });
  };

  const handleAuthorPress = (authorName: string) => {
    navigation.navigate("UserProfile", { authorName });
  };

  const handleLikePress = (postId: string) => {
    likeMutation.mutate(postId);
  };

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onAuthorPress={() => handleAuthorPress(item.author)}
      onLikePress={() => handleLikePress(item.id)}
      onCommentPress={() => handlePostPress(item.id)}
    />
  );

  return (
    <FlatList
      style={styles.container}
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      contentContainerStyle={styles.listContent}
    />
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
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
