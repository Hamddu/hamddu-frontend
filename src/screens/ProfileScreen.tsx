import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { getMyProfile } from "../api/users.api";
import { xpApi, pointsApi, challengesApi, Challenge } from "../services/api";

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diffMs / 86400000);
  if (d === 0) return "오늘";
  if (d === 1) return "어제";
  const dt = new Date(dateStr);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.hamddu.online";

function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function CertCard({ item, wide = false }: { item: Challenge; wide?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = normalizeImageUrl(item.imageUrl);
  return (
    <View style={[styles.certCard, wide && styles.certCardWide]}>
      <View style={[styles.certThumb, wide && styles.certThumbWide]}>
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.certThumbImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text style={styles.certThumbText}>사진 없음</Text>
        )}
      </View>
      <View style={styles.certItemInfo}>
        <Text style={styles.certItemTut} numberOfLines={2}>
          {item.content?.name ?? item.title ?? "인증"}
        </Text>
        <Text style={styles.certItemDate}>{getTimeAgo(item.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const insets = useSafeAreaInsets();
  const [certModalVisible, setCertModalVisible] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });
  const { data: xpWallet } = useQuery({
    queryKey: ["xp", "wallet"],
    queryFn: xpApi.getWallet,
  });
  const { data: pointsWallet } = useQuery({
    queryKey: ["points", "wallet"],
    queryFn: pointsApi.getWallet,
  });
  const {
    data: myChallenges = [],
    isLoading: myChallengesLoading,
    isError: myChallengesError,
    refetch: refetchMyChallenges,
  } = useQuery({
    queryKey: ["challenges", "my"],
    queryFn: challengesApi.getMyChallenges,
  });

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator
          size="large"
          color="#FF7325"
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>마이 정보를 불러오지 못했어요</Text>
          <Text style={styles.emptyText}>잠시 후 다시 시도해주세요</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetchProfile()} activeOpacity={0.75}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const xpPct =
    xpWallet?.nextLevelThreshold && xpWallet.nextLevelThreshold > 0
      ? Math.min((xpWallet.totalXp / xpWallet.nextLevelThreshold) * 100, 100)
      : 0;
  const displayName = profile?.nickname ?? "닉네임 없음";
  const avatarText = displayName.slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>마이</Text>
            <Text style={styles.screenSubTitle}>내 뜨개 기록과 인증을 모아봤어요</Text>
          </View>
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.username} numberOfLines={1}>
                {displayName}
              </Text>
              {xpWallet ? (
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv.{xpWallet.currentLevel}</Text>
                </View>
              ) : null}
            </View>
            {xpWallet ? (
              <View style={styles.xpRow}>
                <View style={styles.xpLabels}>
                  <Text style={styles.xpLabel}>
                    XP {xpWallet.totalXp} / {xpWallet.nextLevelThreshold ?? "-"}
                  </Text>
                  {typeof xpWallet.nextLevelThreshold === "number" ? (
                    <Text style={styles.xpNext}>
                      다음 레벨까지 {Math.max(xpWallet.nextLevelThreshold - xpWallet.totalXp, 0)}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.xpBar}>
                  <View style={[styles.xpFill, { width: `${xpPct}%` as any }]} />
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {pointsWallet ? pointsWallet.balance.toLocaleString() : "-"}
            </Text>
            <Text style={styles.statLabel}>포인트</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statValueOrange]}>
              {myChallenges.length}
            </Text>
            <Text style={styles.statLabel}>인증 완료</Text>
          </View>
        </View>

        {/* 나의 인증 게시글 */}
        <View style={styles.certSection}>
          <View style={styles.certSectionHeader}>
            <View>
              <Text style={styles.certSectionTitle}>나의 인증 게시글</Text>
              <Text style={styles.certSectionSub}>
                튜토리얼을 완료하면 여기에 모여요
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCertModalVisible(true)}
              disabled={myChallenges.length === 0}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.certSectionAll,
                  myChallenges.length === 0 && styles.certSectionAllDisabled,
                ]}
              >
                전체 {myChallenges.length}
              </Text>
            </TouchableOpacity>
          </View>

          {myChallengesLoading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator size="small" color={PRIMARY} />
            </View>
          ) : myChallengesError ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>인증 게시글을 불러오지 못했어요</Text>
              <Text style={styles.emptyText}>잠시 후 다시 시도해주세요</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchMyChallenges()} activeOpacity={0.75}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : myChallenges.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                아직 인증한 튜토리얼이 없어요
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.certCarousel}
            >
              {myChallenges.slice(0, 6).map((item) => (
                <CertCard key={item.id} item={item} />
              ))}
            </ScrollView>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={certModalVisible} animationType="slide">
        <SafeAreaView
          edges={["left", "right"]}
          style={[
            styles.modalSafeArea,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>나의 인증 게시글</Text>
              <Text style={styles.modalSub}>전체 {myChallenges.length}개</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setCertModalVisible(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalGrid}>
            {myChallenges.map((item) => (
              <CertCard key={item.id} item={item} wide />
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";
const SURFACE = "#F7F5F2";
const PRIMARY_DEEP = "#C7521A";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 48 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LINE,
  },
  avatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY_DEEP,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    marginBottom: 10,
  },
  username: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "800",
    color: INK1,
  },
  levelBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  levelText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  xpRow: { gap: 4 },
  xpLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 3,
  },
  xpLabel: { fontSize: 10, color: INK3, fontWeight: "700" },
  xpNext: { fontSize: 10, color: PRIMARY, fontWeight: "700" },
  xpBar: {
    height: 7,
    backgroundColor: SURFACE,
    borderRadius: 4,
    overflow: "hidden",
  },
  xpFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 4 },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 22,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: INK1,
  },
  statValueOrange: { color: PRIMARY },
  statLabel: { fontSize: 11, color: INK3, fontWeight: "800", marginTop: 3 },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#E6DED7",
    marginVertical: 4,
  },
  certSection: { marginBottom: 22 },
  certSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  certSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: INK1,
  },
  certSectionSub: {
    fontSize: 12,
    color: INK3,
    fontWeight: "600",
    marginTop: 2,
  },
  certSectionAll: {
    fontSize: 12,
    fontWeight: "800",
    color: PRIMARY,
    paddingTop: 2,
  },
  certSectionAllDisabled: { color: INK3 },
  certCarousel: {
    gap: 10,
    paddingHorizontal: 20,
  },
  certCard: {
    width: 158,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LINE,
  },
  certCardWide: {
    width: "48.5%",
    marginBottom: 12,
  },
  certThumb: {
    height: 122,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  certThumbWide: {
    height: 136,
  },
  certThumbImage: {
    width: "100%",
    height: "100%",
  },
  certThumbText: { fontSize: 11, color: INK3, fontWeight: "700" },
  certItemInfo: { padding: 10 },
  certItemTut: {
    fontSize: 12,
    fontWeight: "800",
    color: INK1,
    lineHeight: 17,
  },
  certItemDate: {
    fontSize: 11,
    color: INK3,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyBox: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: INK1,
    marginBottom: 5,
    textAlign: "center",
  },
  emptyText: { fontSize: 13, color: INK3, fontWeight: "600" },
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
  logoutBtn: {
    marginHorizontal: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnText: { fontSize: 14, fontWeight: "700", color: INK2 },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: INK1,
  },
  modalSub: {
    fontSize: 11,
    fontWeight: "700",
    color: INK3,
    marginTop: 2,
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: SURFACE,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: "800",
    color: INK2,
  },
  modalGrid: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
