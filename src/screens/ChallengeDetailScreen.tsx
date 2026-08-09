import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { challengesApi } from "../services/api";
import { CommunityStackParamList } from "../types/navigation";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.hamddu.online";
const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";
const SURFACE = "#F7F5F2";
const WHITE = "#FFFFFF";

type ChallengeDetailRouteProp = RouteProp<CommunityStackParamList, "ChallengeDetail">;

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

function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function stripHtml(html?: string | null): string {
  return (html ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

export default function ChallengeDetailScreen() {
  const route = useRoute<ChallengeDetailRouteProp>();
  const { width } = useWindowDimensions();
  const { challengeId } = route.params;
  const [imageFailed, setImageFailed] = useState(false);
  const { data: challenges = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["challenges"],
    queryFn: challengesApi.getChallenges,
  });
  const challenge = challenges.find((item) => item.id === challengeId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>인증 게시글을 불러오지 못했어요</Text>
        <Text style={styles.emptyText}>잠시 후 다시 시도해주세요</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} activeOpacity={0.75}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>인증 게시글을 찾을 수 없어요</Text>
        <Text style={styles.emptyText}>삭제되었거나 접근할 수 없는 게시글이에요</Text>
      </SafeAreaView>
    );
  }

  const imageUrl = normalizeImageUrl(challenge.imageUrl);
  const authorName = challenge.author?.nickname ?? "익명";
  const avatarText = authorName.slice(0, 2);
  const body = stripHtml(challenge.body);

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photoCard}>
          {imageUrl && !imageFailed ? (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.photo, { height: Math.min(width * 1.12, 520) }]}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={[styles.photo, styles.photoEmpty, { height: Math.min(width * 1.12, 520) }]}>
              <Text style={styles.photoEmptyText}>사진 없음</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarText}</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
              <Text style={styles.meta}>{getTimeAgo(challenge.createdAt)}</Text>
            </View>
          </View>

          <Text style={styles.tutorialChip}>{challenge.content?.name ?? "튜토리얼 인증"}</Text>
          <Text style={styles.title}>{challenge.title ?? "인증 게시글"}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  center: {
    flex: 1,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK1,
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "700",
    color: INK3,
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
  content: {
    paddingTop: 0,
    paddingBottom: 104,
  },
  photoCard: {
    overflow: "hidden",
    backgroundColor: SURFACE,
  },
  photo: {
    width: "100%",
  },
  photoEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoEmptyText: {
    fontSize: 13,
    fontWeight: "700",
    color: INK3,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: WHITE,
    padding: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: PRIMARY_DEEP,
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "800",
    color: INK1,
  },
  meta: {
    fontSize: 11,
    fontWeight: "600",
    color: INK3,
    marginTop: 1,
  },
  tutorialChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: PRIMARY_SOFT,
    color: PRIMARY_DEEP,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 10,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: INK1,
    lineHeight: 28,
  },
  body: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: INK2,
  },
});
