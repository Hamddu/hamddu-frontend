import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  useWindowDimensions,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { challengesApi } from "../services/api";
import { CommunityStackParamList } from "../types/navigation";
import ChallengeImagePlaceholder from "../components/ChallengeImagePlaceholder";
import { getAvatarColors } from "../utils/avatarColors";
import Ionicons from "@expo/vector-icons/Ionicons";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.hamddu.online";
const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const { data: challenges = [], isLoading, isError, isRefetching, refetch } = useQuery({
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
  const authorName = challenge.author?.nickname || "익명";
  const authorImageUrl = normalizeImageUrl(challenge.author?.profileImageUrl);
  const avatarText = authorName.slice(0, 2);
  const avatarColors = getAvatarColors(challenge.author?.id ?? authorName);
  const body = stripHtml(challenge.body);
  const tutorialName = challenge.content?.name ?? "튜토리얼 인증";
  const title = challenge.title ?? "인증 게시글";
  const tutorialLabel = tutorialName.trim() === title.trim() ? "튜토리얼 인증" : tutorialName;

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      >
        <View style={styles.photoCard}>
          {imageUrl && !imageFailed ? (
            <TouchableOpacity
              style={styles.photoPressable}
              activeOpacity={0.9}
              onPress={() => setPreviewVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="인증 사진 크게 보기"
            >
              <Image
                source={{ uri: imageUrl }}
                style={[styles.photo, { height: Math.min(width, 480) }]}
                resizeMode="cover"
                onError={() => setImageFailed(true)}
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.photo, styles.photoEmpty, { height: Math.min(width, 480) }]}>
              <ChallengeImagePlaceholder />
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: avatarColors.backgroundColor }]}>
              {authorImageUrl ? (
                <Image source={{ uri: authorImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: avatarColors.color }]}>{avatarText}</Text>
              )}
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
              <Text style={styles.meta}>{tutorialLabel} · {getTimeAgo(challenge.createdAt)}</Text>
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
        </View>
      </ScrollView>
      <Modal
        visible={previewVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <Pressable
          style={styles.imagePreviewBackdrop}
          onPress={() => setPreviewVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="이미지 닫기"
        >
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="contain" /> : null}
          <View
            style={styles.imagePreviewClose}
            pointerEvents="none"
          >
            <Ionicons name="close" size={30} color="#fff" />
          </View>
        </Pressable>
      </Modal>
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
  photoPressable: { width: "100%" },
  photoEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: INK1,
    lineHeight: 32,
  },
  body: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 26,
    color: INK2,
  },
  imagePreviewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.94)",
    justifyContent: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePreviewClose: {
    position: "absolute",
    top: 54,
    right: 18,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
