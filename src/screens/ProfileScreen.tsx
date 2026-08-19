import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../store/authStore";
import { unregisterPushNotifications } from "../services/notifications";
import { getMyProfile, updateNickname } from "../api/users.api";
import { xpApi, pointsApi, challengesApi, feedbacksApi, nicknamesApi, Challenge } from "../services/api";

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
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSendFeedback = async () => {
    const body = feedback.trim();
    if (!body || isSendingFeedback) return;

    setIsSendingFeedback(true);
    try {
      await feedbacksApi.create(body);
      setFeedback("");
      setFeedbackModalVisible(false);
      Alert.alert("의견을 보냈어요", "소중한 의견 감사합니다.");
    } catch {
      Alert.alert("의견을 보내지 못했어요", "잠시 후 다시 시도해주세요.");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const openNicknameModal = () => {
    setNickname(profile?.nickname ?? "");
    setNicknameModalVisible(true);
  };

  const handleSaveNickname = async () => {
    const value = nickname.trim();
    if (value.length < 2 || value === profile?.nickname || isSavingNickname) return;

    setIsSavingNickname(true);
    try {
      if (!(await nicknamesApi.check(value))) {
        Alert.alert("사용 중인 닉네임이에요", "다른 닉네임을 입력해주세요.");
        return;
      }
      const updatedProfile = await updateNickname(value);
      queryClient.setQueryData(["profile", "me"], updatedProfile);
      setNicknameModalVisible(false);
      Alert.alert("닉네임을 변경했어요");
    } catch {
      Alert.alert("닉네임을 변경하지 못했어요", "잠시 후 다시 시도해주세요.");
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleLogout = async () => {
    try {
      await unregisterPushNotifications();
    } catch (error) {
      console.warn("Failed to unregister push notifications", error);
    } finally {
      logout();
    }
  };

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });
  const { data: xpWallet, refetch: refetchXp } = useQuery({
    queryKey: ["xp", "wallet"],
    queryFn: xpApi.getWallet,
  });
  const { data: pointsWallet, refetch: refetchPoints } = useQuery({
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

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      refetchXp();
      refetchPoints();
      refetchMyChallenges();
    }, [refetchProfile, refetchXp, refetchPoints, refetchMyChallenges]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchXp(),
        refetchPoints(),
        refetchMyChallenges(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchProfile, refetchXp, refetchPoints, refetchMyChallenges]);

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
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF7325"
            colors={["#FF7325"]}
          />
        }
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
              <TouchableOpacity
                style={styles.editNicknameBtn}
                onPress={openNicknameModal}
                accessibilityRole="button"
                accessibilityLabel="닉네임 수정"
              >
                <Text style={styles.editNicknameText}>수정</Text>
              </TouchableOpacity>
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

        <TouchableOpacity
          style={styles.feedbackBtn}
          onPress={() => setFeedbackModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="의견함 열기"
        >
          <Text style={styles.feedbackBtnText}>의견함</Text>
          <Text style={styles.feedbackBtnArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
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

      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <SafeAreaView style={styles.feedbackSafeArea}>
          <View style={styles.feedbackHeader}>
            <View>
              <Text style={styles.feedbackEyebrow}>HAMDDU FEEDBACK</Text>
              <Text style={styles.feedbackTitle}>어떤 점을 바꿔볼까요?</Text>
            </View>
            <TouchableOpacity
              style={styles.feedbackCloseBtn}
              onPress={() => setFeedbackModalVisible(false)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="의견함 닫기"
            >
              <Text style={styles.feedbackCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.feedbackForm}>
            <View style={styles.feedbackIntro}>
              <View style={styles.feedbackIntroIcon}>
                <Text style={styles.feedbackIntroIconText}>✦</Text>
              </View>
              <View style={styles.feedbackIntroCopy}>
                <Text style={styles.feedbackIntroTitle}>작은 의견도 좋아요</Text>
                <Text style={styles.feedbackIntroText}>
                  불편했던 점이나 새로 있었으면 하는 기능을 자유롭게 적어주세요.
                </Text>
              </View>
            </View>
            <View style={styles.feedbackInputCard}>
              <TextInput
                style={styles.feedbackInput}
                value={feedback}
                onChangeText={setFeedback}
                placeholder="예) 튜토리얼 자막이 있으면 좋겠어요"
                placeholderTextColor="#AAA29C"
                multiline
                maxLength={2000}
                textAlignVertical="top"
                accessibilityLabel="의견 내용"
              />
              <Text style={styles.feedbackCount}>{feedback.length.toLocaleString()} / 2,000</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.feedbackSubmitBtn,
                (!feedback.trim() || isSendingFeedback) && styles.feedbackSubmitBtnDisabled,
              ]}
              onPress={handleSendFeedback}
              disabled={!feedback.trim() || isSendingFeedback}
              activeOpacity={0.75}
            >
              {isSendingFeedback ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.feedbackSubmitText}>의견 보내기  →</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.feedbackPrivacy}>보내주신 의견은 서비스 개선에만 사용돼요.</Text>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={nicknameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.nicknameDialog}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <TextInput
              style={styles.nicknameInput}
              value={nickname}
              onChangeText={(text) => setNickname(text.replace(/[^가-힣a-zA-Z0-9\s]/g, ""))}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor={INK3}
              maxLength={30}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveNickname}
              accessibilityLabel="새 닉네임"
            />
            <Text style={styles.nicknameHint}>2~30자, 한글/영문/숫자/공백만 가능</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setNicknameModalVisible(false)}
                disabled={isSavingNickname}
              >
                <Text style={styles.dialogCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogSaveBtn,
                  (nickname.trim().length < 2 || nickname.trim() === profile?.nickname || isSavingNickname) &&
                    styles.feedbackSubmitBtnDisabled,
                ]}
                onPress={handleSaveNickname}
                disabled={nickname.trim().length < 2 || nickname.trim() === profile?.nickname || isSavingNickname}
              >
                {isSavingNickname ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.feedbackSubmitText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  editNicknameBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: SURFACE,
  },
  editNicknameText: { fontSize: 10, fontWeight: "800", color: INK2 },
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
  feedbackBtn: {
    marginHorizontal: 20,
    marginBottom: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedbackBtnText: { fontSize: 14, fontWeight: "800", color: INK1 },
  feedbackBtnArrow: { fontSize: 24, color: INK3 },
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
  feedbackSafeArea: { flex: 1, backgroundColor: "#FFF8F2" },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
  },
  feedbackEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: PRIMARY,
    marginBottom: 6,
  },
  feedbackTitle: { fontSize: 24, fontWeight: "800", color: INK1, letterSpacing: -0.6 },
  feedbackCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackCloseText: { fontSize: 26, lineHeight: 28, fontWeight: "400", color: INK2 },
  feedbackForm: { flex: 1, paddingHorizontal: 20, paddingBottom: 14 },
  feedbackIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: PRIMARY_SOFT,
    marginBottom: 14,
  },
  feedbackIntroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackIntroIconText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  feedbackIntroCopy: { flex: 1 },
  feedbackIntroTitle: { fontSize: 14, fontWeight: "800", color: INK1, marginBottom: 3 },
  feedbackIntroText: { fontSize: 12, lineHeight: 17, fontWeight: "600", color: INK2 },
  feedbackInputCard: {
    minHeight: 220,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F0E5DC",
  },
  feedbackInput: {
    flex: 1,
    minHeight: 160,
    padding: 0,
    fontSize: 15,
    lineHeight: 23,
    color: INK1,
  },
  feedbackCount: {
    textAlign: "right",
    fontSize: 11,
    fontWeight: "600",
    color: INK3,
  },
  feedbackSubmitBtn: {
    height: 54,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackSubmitBtnDisabled: { opacity: 0.4 },
  feedbackSubmitText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  feedbackPrivacy: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: INK3,
  },
  dialogBackdrop: {
    flex: 1,
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  nicknameDialog: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 20,
  },
  nicknameInput: {
    height: 50,
    marginTop: 18,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: INK1,
  },
  nicknameHint: { marginTop: 7, fontSize: 11, color: INK3 },
  dialogActions: { flexDirection: "row", gap: 8, marginTop: 20 },
  dialogCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogCancelText: { fontSize: 14, fontWeight: "800", color: INK2 },
  dialogSaveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  modalGrid: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
