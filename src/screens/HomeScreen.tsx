import React, { useState } from "react";
import { FlatList, StyleSheet, View, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { usePosts, useLikePost } from "../hooks/usePosts";
import { Post } from "../store/postStore";
import { HomeStackParamList } from "../types/navigation";
import PostCard from "../components/PostCard";

const YoutubePlayer = Platform.OS !== "web"
  ? require("react-native-youtube-iframe").default
  : null;

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

// 테스트용 영상 목록
const TEST_VIDEOS = [
  { id: "dQw4w9WgXcQ", title: "테스트 영상 1" },
  { id: "9bZkp7q19f0", title: "테스트 영상 2" },
  { id: "JGwWNGJdvx8", title: "테스트 영상 3" },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data: posts, isLoading, error } = usePosts();
  const likeMutation = useLikePost();
  const [showVideos, setShowVideos] = useState(false);

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
      ListHeaderComponent={
        <View>
          <TouchableOpacity
            style={styles.videoButton}
            onPress={() => setShowVideos((prev) => !prev)}
          >
            <Text style={styles.videoButtonText}>
              {showVideos ? "영상 닫기" : "영상 보기"}
            </Text>
          </TouchableOpacity>
          {showVideos && (
            <View style={styles.videoList}>
              {TEST_VIDEOS.map((video) => (
                <View key={video.id} style={styles.videoItem}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  {YoutubePlayer ? (
                    <YoutubePlayer height={200} videoId={video.id} />
                  ) : (
                    <View style={styles.webPlaceholder}>
                      <Text style={{ color: "#999" }}>모바일에서 확인하세요</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      }
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
  videoButton: {
    backgroundColor: "#5A37A2",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  videoButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  videoList: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  videoItem: {
    marginBottom: 16,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  webPlaceholder: {
    height: 200,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
});
