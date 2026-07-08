import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { getMyProfile } from "../api/users.api";
import { xpApi, pointsApi, challengesApi } from "../services/api";

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diffMs / 86400000);
  if (d === 0) return "오늘";
  if (d === 1) return "어제";
  const dt = new Date(dateStr);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading: profileLoading } = useQuery({
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
  const { data: myChallenges = [] } = useQuery({
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

  const level = xpWallet?.currentLevel ?? 1;
  const currentXp = xpWallet?.totalXp ?? 0;
  const nextXp = xpWallet?.nextLevelThreshold ?? 100;
  const xpPct = nextXp > 0 ? Math.min((currentXp / nextXp) * 100, 100) : 0;
  const points = pointsWallet?.balance ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>마이</Text>
        </View>

        {/* 유저 카드 */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarEmoji}>🐹</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{level}</Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {profile?.nickname ?? "함뜨개인"}
            </Text>
            <View style={styles.xpRow}>
              <View style={styles.xpLabels}>
                <Text style={styles.xpLabel}>
                  XP {currentXp} / {nextXp}
                </Text>
                <Text style={styles.xpNext}>
                  다음 레벨까지 {nextXp - currentXp}
                </Text>
              </View>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${xpPct}%` as any }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 포인트 / 인증 수 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{points.toLocaleString()}</Text>
            <Text style={styles.statStars}>★ POINT</Text>
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
                튜토리얼을 완료할 때마다 자동으로 모여요
              </Text>
            </View>
            <Text style={styles.certSectionAll}>
              전체 {myChallenges.length}
            </Text>
          </View>

          {myChallenges.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                아직 인증한 튜토리얼이 없어요 🐹
              </Text>
            </View>
          ) : (
            <View style={styles.certGrid}>
              {myChallenges.slice(0, 6).map((item) => (
                <View key={item.id} style={styles.certGridItem}>
                  <View style={styles.certThumb}>
                    <Text style={styles.certThumbText}>🧶</Text>
                  </View>
                  <View style={styles.certItemInfo}>
                    <Text style={styles.certItemTut} numberOfLines={1}>
                      {item.content?.name ?? item.title ?? "인증"}
                    </Text>
                    <Text style={styles.certItemDate}>
                      {getTimeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 40 },
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
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LINE,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarEmoji: { fontSize: 36 },
  levelBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: PRIMARY,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#fff",
  },
  levelText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  userInfo: { flex: 1, minWidth: 0 },
  username: {
    fontSize: 18,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  xpRow: { gap: 3 },
  xpLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  xpLabel: { fontSize: 10, color: INK3, fontWeight: "700" },
  xpNext: { fontSize: 10, color: PRIMARY, fontWeight: "700" },
  xpBar: {
    height: 6,
    backgroundColor: LINE,
    borderRadius: 3,
    overflow: "hidden",
  },
  xpFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 3 },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LINE,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -1,
  },
  statValueOrange: { color: PRIMARY },
  statStars: { fontSize: 11, color: PRIMARY, fontWeight: "700", marginTop: 2 },
  statLabel: { fontSize: 11, color: INK3, fontWeight: "700", marginTop: 2 },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: LINE,
    marginVertical: 4,
  },
  certSection: { paddingHorizontal: 20, marginBottom: 20 },
  certSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  certSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -0.3,
  },
  certSectionSub: { fontSize: 11, color: INK3, marginTop: 2 },
  certSectionAll: { fontSize: 11, fontWeight: "700", color: PRIMARY },
  certGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  certGridItem: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LINE,
  },
  certThumb: {
    height: 96,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  certThumbText: { fontSize: 28 },
  certItemInfo: { padding: 8 },
  certItemTut: { fontSize: 11, fontWeight: "800", color: INK1 },
  certItemDate: { fontSize: 10, color: INK3, marginTop: 1 },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LINE,
  },
  emptyText: { fontSize: 13, color: INK3, fontWeight: "600" },
  logoutBtn: {
    marginHorizontal: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnText: { fontSize: 14, fontWeight: "700", color: INK2 },
});
