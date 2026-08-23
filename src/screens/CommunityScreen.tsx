import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SectionList,
  ActivityIndicator,
  ScrollView,
  Image,
  RefreshControl,
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
import ChallengeImagePlaceholder from "../components/ChallengeImagePlaceholder";
import Ionicons from "@expo/vector-icons/Ionicons";

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
        <ChallengeImagePlaceholder compact />
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
  const catName = getCategoryLabel(post.category?.name ?? "");
  const thumbUrl = post.media?.[0]?.url;
  const mediaCount = post.media?.length ?? 0;
  const meta = [post.author?.nickname ?? "익명", getTimeAgo(post.createdAt), catName]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      style={[styles.postItem, !thumbUrl && styles.postItemTextOnly]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {thumbUrl ? (
        <View style={styles.postThumbWrap}>
          <Image source={{ uri: thumbUrl }} style={styles.postThumb} resizeMode="cover" />
          {mediaCount > 1 && (
            <View style={styles.postThumbBadge}>
              <Text style={styles.postThumbBadgeText}>+{mediaCount - 1}</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={[styles.postBodyContent, !thumbUrl && styles.postBodyContentTextOnly]}>
        <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.postMeta} numberOfLines={1}>{meta}</Text>
        <Text style={styles.postBody} numberOfLines={2}>{stripHtml(post.body)}</Text>
        <View style={styles.postFooterActions}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={(event) => {
              event.stopPropagation();
              onLike();
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: post.likedByMe }}
          >
            <Ionicons
              name={post.likedByMe ? "heart" : "heart-outline"}
              size={17}
              color={post.likedByMe ? PRIMARY : INK3}
            />
            <Text style={[styles.postActionText, post.likedByMe && styles.postActionLiked]}>
              {post.likeCount}
            </Text>
          </TouchableOpacity>
          {(post.commentCount ?? 0) > 0 ? (
            <View style={styles.postAction}>
              <Ionicons name="chatbubble-outline" size={16} color={INK3} />
              <Text style={styles.postActionText}>{post.commentCount}</Text>
            </View>
          ) : null}
        </View>
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
    isRefetching: postsRefreshing,
    refetch: refetchPosts,
  } = usePosts(selectedCategoryId);
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
  });
  const {
    data: challenges = [],
    isLoading: challengesLoading,
    isError: challengesError,
    isRefetching: challengesRefreshing,
    refetch: refetchChallenges,
  } = useQuery({
    queryKey: ["challenges"],
    queryFn: challengesApi.getChallenges,
  });
  const { toggle: toggleLike } = useToggleLike();
  const categoryTabs = [{ id: "all", label: "전체" }, ...categories];
  const { width } = useWindowDimensions();
  const certTileSize = Math.floor((width - 40 - 16) / 3);
  const communityTabs = (
    <View style={styles.tabRow}>
      {(["post", "cert"] as Tab[]).map((t) => (
        <TouchableOpacity
          key={t}
          style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
          onPress={() => setTab(t)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
            {t === "post" ? "일반 게시글" : "인증 게시글"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  const categoryBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.catBar}
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
  );

  return (
    <SafeAreaView style={styles.container}>
      {tab === "post" ? (
        <View style={styles.postSection}>
          {isLoading ? (
            <>{communityTabs}<View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View></>
          ) : postsError ? (
            <>{communityTabs}<View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>게시글을 불러오지 못했어요</Text>
                <Text style={styles.emptyStateText}>잠시 후 다시 시도해주세요</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetchPosts()} activeOpacity={0.75}>
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
              </View></>
          ) : (
            <SectionList
              sections={[{ data: posts }]}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={styles.postListContent}
              alwaysBounceVertical
              stickySectionHeadersEnabled
              refreshControl={
                <RefreshControl
                  refreshing={postsRefreshing}
                  onRefresh={() => {
                    void Promise.all([refetchPosts(), refetchCategories()]);
                  }}
                  tintColor="#FF7325"
                  colors={["#FF7325"]}
                />
              }
              ListHeaderComponent={communityTabs}
              renderSectionHeader={() => categoryBar}
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

        </View>
      ) : challengesLoading ? (
        <>{communityTabs}<View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View></>
      ) : challengesError ? (
        <>{communityTabs}<View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>인증 게시글을 불러오지 못했어요</Text>
            <Text style={styles.emptyStateText}>잠시 후 다시 시도해주세요</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetchChallenges()} activeOpacity={0.75}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View></>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.certRow}
          contentContainerStyle={styles.certContent}
          alwaysBounceVertical
          refreshControl={
            <RefreshControl
              refreshing={challengesRefreshing}
              onRefresh={() => void refetchChallenges()}
              tintColor="#FF7325"
              colors={["#FF7325"]}
            />
          }
          ListHeaderComponent={
            <>
              {communityTabs}
              <View style={styles.certHeader}>
                <Text style={styles.certTitle}>튜토리얼 인증</Text>
                <Text style={styles.certNote}>완성한 순간들을 모아봤어요</Text>
              </View>
            </>
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

      {tab === "post" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddPost")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.fabText}>글쓰기</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";
const SURFACE = "#F7F5F2";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  tabBtn: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: INK1,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A3A3A3",
  },
  tabBtnTextActive: {
    fontWeight: "800",
    color: INK1,
  },
  catContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  catBar: {
    backgroundColor: "#FFFFFF",
  },
  catChip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  catChipActive: {
    backgroundColor: INK1,
    borderColor: INK1,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: INK2,
  },
  catChipTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  postSection: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  postListContent: {
    paddingBottom: 148,
  },

  postItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    alignItems: "flex-start",
    gap: 14,
  },
  postItemTextOnly: {
    paddingVertical: 18,
  },
  postBodyContent: {
    flex: 1,
    minWidth: 0,
    minHeight: 112,
  },
  postBodyContentTextOnly: {
    minHeight: 0,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: INK1,
    lineHeight: 22,
    marginBottom: 4,
  },
  postMeta: { fontSize: 12, color: INK3, fontWeight: "600", marginBottom: 7 },
  postBody: { fontSize: 13, color: "#55585E", lineHeight: 19, marginBottom: 8 },
  postFooterActions: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 22,
    gap: 5,
  },
  postActionText: { fontSize: 12, color: INK3, fontWeight: "600" },
  postActionLiked: { color: PRIMARY },
  postThumbWrap: {
    width: 112,
    height: 112,
    borderRadius: 12,
    backgroundColor: SURFACE,
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
    bottom: 114,
    minWidth: 100,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 18,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  certContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 130 },
  certRow: { gap: 8, marginBottom: 8 },
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
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  certImgImage: {
    width: "100%",
    height: "100%",
  },
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
