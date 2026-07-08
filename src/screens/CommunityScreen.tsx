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
} from "react-native";
import { useScreenshotProtection } from "../hooks/useScreenshotProtection";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { usePosts, useToggleLike } from "../hooks/usePosts";
import { Post } from "../store/postStore";
import { categoriesApi, challengesApi } from "../services/api";
import { CommunityStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<CommunityStackParamList>;

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
      style={styles.postItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarText}</Text>
      </View>
      <View style={styles.postBodyArea}>
        <View style={styles.postBodyContent}>
          <View style={styles.postAuthorRow}>
            <Text style={styles.postAuthor} numberOfLines={1}>
              {post.author?.nickname ?? "익명"}
            </Text>
            <Text style={styles.postDot}>·</Text>
            <Text style={styles.postTime}>{getTimeAgo(post.createdAt)}</Text>
          </View>
          {catName ? (
            <View style={styles.postCatChip}>
              <Text style={styles.postCatText}>{catName}</Text>
            </View>
          ) : null}
          <Text style={styles.postTitle} numberOfLines={1}>
            {post.title}
          </Text>
          <Text style={styles.postBody} numberOfLines={2}>
            {stripHtml(post.body)}
          </Text>
          <View style={styles.postFooterRow}>
            <View style={styles.postFooterActions}>
              <TouchableOpacity style={styles.postAction} onPress={onLike}>
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
  const { data: posts = [], isLoading } = usePosts(selectedCategoryId);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
  });
  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: challengesApi.getChallenges,
  });
  const { toggle: toggleLike } = useToggleLike();
  const categoryTabs = [{ id: "all", label: "전체" }, ...categories];

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>커뮤니티</Text>
      </View>

      {/* 일반 / 인증 탭 */}
      <View style={styles.tabRow}>
        {(["post", "cert"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={styles.tabBtn}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}
            >
              {t === "post" ? "일반 게시글" : "인증 게시글"}
            </Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {tab === "post" ? (
        <View style={styles.postSection}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
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
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.certRow}
          contentContainerStyle={styles.certContent}
          ListHeaderComponent={
            <Text style={styles.certNote}>튜토리얼 인증</Text>
          }
          ListEmptyComponent={
            <Text style={styles.certNote}>아직 인증 게시글이 없어요</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.certCard}>
              <View style={styles.certImg}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.certImgImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.certImgText}>인증 사진</Text>
                )}
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certTut}>
                  {item.content?.name ?? "튜토리얼"}
                </Text>
                <Text style={styles.certName}>
                  {item.author?.nickname ?? "익명"}
                </Text>
                <Text style={styles.certTime}>
                  {getTimeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  screenTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -0.4,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    backgroundColor: "#fff",
  },
  tabBtn: {
    paddingVertical: 12,
    position: "relative",
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: INK3,
  },
  tabBtnTextActive: {
    fontWeight: "800",
    color: INK1,
  },
  tabUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -1,
    height: 2.5,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  catContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    gap: 6,
  },
  catChip: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  catChipActive: {
    backgroundColor: INK1,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: INK2,
    whiteSpace: "nowrap",
  } as any,
  catChipTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  postSection: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  postItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "800", color: PRIMARY_DEEP },
  postBodyArea: {
    flex: 1,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  postBodyContent: {
    flex: 1,
    minWidth: 0,
  },
  postAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 3,
  },
  postAuthor: { fontSize: 13, fontWeight: "700", color: INK1 },
  postDot: { fontSize: 11, color: INK3 },
  postTime: { fontSize: 11, color: INK3 },
  postCatChip: {
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  postCatText: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  postBody: { fontSize: 13, color: INK2, lineHeight: 19.5, marginBottom: 6 },
  postFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postFooterActions: { flexDirection: "row", gap: 14 },
  postAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  postActionIcon: { fontSize: 13, color: INK3 },
  postActionText: { fontSize: 12, color: INK3, fontWeight: "600" },
  postThumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: "#F2F2F2",
    marginLeft: 12,
    alignSelf: "center",
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
  certContent: { padding: 20 },
  certRow: { gap: 10, marginBottom: 10 },
  certNote: {
    fontSize: 11,
    color: INK3,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  certCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LINE,
  },
  certImg: {
    height: 130,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  certImgImage: {
    width: "100%",
    height: "100%",
  },
  certImgText: { fontSize: 11, color: INK3 },
  certInfo: { padding: 10 },
  certTut: {
    fontSize: 10,
    fontWeight: "700",
    color: PRIMARY,
    letterSpacing: 0.3,
  },
  certName: { fontSize: 12, fontWeight: "700", color: INK1, marginTop: 2 },
  certTime: { fontSize: 10, color: INK3, marginTop: 2 },
});
