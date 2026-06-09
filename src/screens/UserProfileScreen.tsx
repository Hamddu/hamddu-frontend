import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { CommunityStackParamList } from "../types/navigation";
import { postsApi } from "../services/api";

type RouteType = RouteProp<CommunityStackParamList, "UserProfile">;

export default function UserProfileScreen() {
  const route = useRoute<RouteType>();
  const { authorName } = route.params;

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", "author", authorName],
    queryFn: () => postsApi.getPostsByAuthor(authorName),
    enabled: !!authorName,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{authorName.slice(0, 2)}</Text>
        </View>
        <Text style={styles.name}>{authorName}</Text>
        <Text style={styles.postCount}>게시글 {posts.length}개</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FF7325" style={{ marginTop: 40 }} />
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 작성한 게시글이 없어요</Text>
        </View>
      ) : (
        <View style={styles.postList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postItem}>
              <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
              <Text style={styles.postBody} numberOfLines={2}>{post.body}</Text>
              <Text style={styles.postMeta}>♥ {post.likeCount} · 💬 {post.commentCount}</Text>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { alignItems: "center", paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: LINE, backgroundColor: "#fff" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY_SOFT, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { fontSize: 24, fontWeight: "800", color: PRIMARY_DEEP },
  name: { fontSize: 18, fontWeight: "800", color: INK1, marginBottom: 4 },
  postCount: { fontSize: 12, color: INK3, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: INK3 },
  postList: { padding: 16, gap: 10 },
  postItem: { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: LINE },
  postTitle: { fontSize: 14, fontWeight: "800", color: INK1, marginBottom: 4 },
  postBody: { fontSize: 13, color: "#404040", lineHeight: 18, marginBottom: 8 },
  postMeta: { fontSize: 11, color: INK3, fontWeight: "600" },
});
