import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { useScreenshotProtection } from "../hooks/useScreenshotProtection";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { usePosts, useToggleLike } from "../hooks/usePosts";
import { Post } from "../store/postStore";
import { categoriesApi, challengesApi, Challenge } from "../services/api";
import { CommunityStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<CommunityStackParamList>;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.hamddu.online";

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

type Tab = "post" | "cert";
function getCategoryLabel(catName: string): string {
  return catName.replace(/^뜨개\s*/, "");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function ChallengeGridItem({
  item,
  size,
  onPress,
}: {
  item: Challenge;
  size: number;
  onPress: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = normalizeImageUrl(item.imageUrl);

  return (
    <TouchableOpacity
      style={[styles.certCard, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.certImgImage}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text style={styles.certImgText}>사진 없음</Text>
      )}
    </TouchableOpacity>
  );
}

function PostListItem({
  post,
  onPress,
  onLike,
}: {
  post: Post;
  onPress: () => void;
  onLike: () => void;
}) {
  const avatarText = (post.author?.nickname ?? "??").slice(0, 2);
  const catName = getCategoryLabel(post.category?.name ?? "");
  const thumbUrl = post.media?.[0]?.url;
  const mediaCount = post.media?.length ?? 0;

  return (
    <TouchableOpacity
      style={[styles.postItem, !thumbUrl && styles.postItemTextOnly]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.postTopRow}>
        <View style={styles.postAuthorLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
          <View style={styles.postAuthorMeta}>
            <Text style={styles.postAuthor} numberOfLines={1}>
              {post.author?.nickname ?? "익명"}
            </Text>
            <Text style={styles.postTime}>{getTimeAgo(post.createdAt)}</Text>
          </View>
        </View>
        {catName ? (
          <View style={styles.postCatChip}>
            <Text style={styles.postCatText}>{catName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.postBodyArea}>
        <View style={styles.postBodyContent}>
          <Text style={styles.postTitle} numberOfLines={1}>
            {post.title}
          </Text>
          <Text style={styles.postBody} numberOfLines={2}>
            {stripHtml(post.body)}
          </Text>
          <View style={styles.postFooterRow}>
            <View style={styles.postFooterActions}>
              <TouchableOpacity style={styles.postAction} onPress={onLike} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.postActionIcon,
                    post.likedByMe && { color: PRIMARY },
                  ]}
                >
                  ♥
                </Text>
                <Text style={styles.postActionText}>{post.likeCount}</Text>
              </TouchableOpacity>
              <View style={styles.postAction}>
                <Text style={styles.postActionIcon}>💬</Text>
                <Text style={styles.postActionText}>{post.commentCount}</Text>
              </View>
            </View>
          </View>
        </View>
        {thumbUrl ? (
          <View style={styles.postThumbWrap}>
            <Image
              source={{ uri: thumbUrl }}
              style={styles.postThumb}
              resizeMode="cover"
            />
            {mediaCount > 1 && (
              <View style={styles.postThumbBadge}>
                <Text style={styles.postThumbBadgeText}>+{mediaCount - 1}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function CommunityScreen() {
  const navigation = useNavigation<NavigationProp>();
  useScreenshotProtection();
  const [tab, setTab] = useState<Tab>("post");
  const [cat, setCat] = useState("all");
  const selectedCategoryId = cat === "all" ? undefined : cat;
  const {
    data: posts = [],
    isLoading,
    isError: postsError,
    refetch: refetchPosts,
  } = usePosts(selectedCategoryId);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
  });
  const {
    data: challenges = [],
    isLoading: challengesLoading,
    isError: challengesError,
    refetch: refetchChallenges,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: challengesApi.getChallenges,
  });
  const { toggle: toggleLike } = useToggleLike();
  const categoryTabs = [{ id: "all", label: "전체" }, ...categories];
  const { width } = useWindowDimensions();
  const certTileSize = Math.floor((width - 40 - 2) / 3);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>커뮤니티</Text>
          <Text style={styles.screenSubTitle}>
            뜨개 이야기를 모아보는 공간
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {(["post", "cert"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}
            >
              {t === "post" ? "일반 게시글" : "인증 게시글"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "post" ? (
        <View style={styles.postSection}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : postsError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>게시글을 불러오지 못했어요</Text>
              <Text style={styles.emptyStateText}>잠시 후 다시 시도해주세요</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchPosts()} activeOpacity={0.75}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={styles.postListContent}
              ListHeaderComponent={
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catContent}
                >
                  {categoryTabs.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, cat === c.id && styles.catChipActive]}
                      onPress={() => setCat(c.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.catChipText, cat === c.id && styles.catChipTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>아직 게시글이 없어요</Text>
                  <Text style={styles.emptyStateText}>첫 뜨개 이야기를 남겨보세요</Text>
                </View>
              }
              renderItem={({ item }) => (
                <PostListItem
                  post={item}
                  onPress={() =>
                    navigation.navigate("PostDetail", { postId: item.id })
                  }
                  onLike={() => toggleLike(item)}
                />
              )}
            />
          )}

          {/* FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("AddPost")}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : challengesLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : challengesError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>인증 게시글을 불러오지 못했어요</Text>
          <Text style={styles.emptyStateText}>잠시 후 다시 시도해주세요</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetchChallenges()} activeOpacity={0.75}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.certRow}
          contentContainerStyle={styles.certContent}
          ListHeaderComponent={
            <View style={styles.certHeader}>
              <Text style={styles.certTitle}>튜토리얼 인증</Text>
              <Text style={styles.certNote}>완성한 순간들을 모아봤어요</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>아직 인증 게시글이 없어요</Text>
              <Text style={styles.emptyStateText}>튜토리얼을 완료하면 여기에 모여요</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChallengeGridItem
              item={item}
              size={certTileSize}
              onPress={() => navigation.navigate("ChallengeDetail", { challengeId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";
const PRIMARY_DEEP = "#C7521A";
const SURFACE = "#F7F5F2";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: INK1,
    lineHeight: 30,
  },
  screenSubTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: INK3,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 4,
    borderRadius: 999,
    backgroundColor: SURFACE,
  },
  tabBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: INK3,
  },
  tabBtnTextActive: {
    fontWeight: "800",
    color: INK1,
  },
  catContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 6,
  },
  catChip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  catChipActive: {
    backgroundColor: "#fff",
    borderColor: PRIMARY,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: INK2,
  },
  catChipTextActive: {
    color: PRIMARY,
    fontWeight: "800",
  },
  postSection: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  postListContent: {
    paddingBottom: 104,
  },

  postItem: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
  },
  postItemTextOnly: {
    backgroundColor: "#fff",
  },
  postTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  postAuthorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "800", color: PRIMARY_DEEP },
  postAuthorMeta: {
    marginLeft: 9,
    flex: 1,
    minWidth: 0,
  },
  postBodyArea: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  postBodyContent: {
    flex: 1,
    minWidth: 0,
  },
  postAuthor: { fontSize: 13, fontWeight: "800", color: INK1 },
  postTime: { fontSize: 11, color: INK3, fontWeight: "600", marginTop: 1 },
  postCatChip: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  postCatText: {
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY_DEEP,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: INK1,
    lineHeight: 22,
    marginBottom: 4,
  },
  postBody: { fontSize: 13, color: INK2, lineHeight: 20, marginBottom: 10 },
  postFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postFooterActions: { flexDirection: "row", gap: 14 },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 24,
  },
  postActionIcon: { fontSize: 13, color: INK3 },
  postActionText: { fontSize: 12, color: INK3, fontWeight: "600" },
  postThumbWrap: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: SURFACE,
    marginLeft: 12,
    overflow: "hidden",
  },
  postThumb: {
    width: "100%",
    height: "100%",
  },
  postThumbBadge: {
    position: "absolute",
    right: 5,
    bottom: 5,
    minWidth: 24,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.58)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  postThumbBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 26, fontWeight: "800", lineHeight: 28 },
  certContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 104 },
  certRow: { gap: 1, marginBottom: 1 },
  certHeader: {
    marginBottom: 12,
  },
  certTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: INK1,
  },
  certNote: {
    fontSize: 12,
    color: INK3,
    fontWeight: "600",
    marginTop: 2,
  },
  certCard: {
    backgroundColor: SURFACE,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  certImgImage: {
    width: "100%",
    height: "100%",
  },
  certImgText: { fontSize: 11, color: INK3, fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK1,
  },
  emptyStateText: {
    fontSize: 12,
    fontWeight: "600",
    color: INK3,
    marginTop: 5,
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
});
