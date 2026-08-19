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
import { getMyProfile, updateProfile } from "../api/users.api";
import { xpApi, pointsApi, challengesApi, feedbacksApi, nicknamesApi, Challenge } from "../services/api";
import ChallengeImagePlaceholder from "../components/ChallengeImagePlaceholder";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getAvatarColors } from "../utils/avatarColors";
import { pickAndUploadImage, ImageSource } from "../services/imageUpload";

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

const isValidNickname = (value: string) => /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]{2,30}$/.test(value.trim());

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
          <ChallengeImagePlaceholder compact />
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
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileMediaId, setProfileMediaId] = useState<string | null>(null);
  const [profileImageChanged, setProfileImageChanged] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
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
    setProfileImageUrl(profile?.profileImageUrl ?? null);
    setProfileMediaId(profile?.profileMediaId ?? null);
    setProfileImageChanged(false);
    setNicknameModalVisible(true);
  };

  const uploadProfileImage = async (source: ImageSource) => {
    setIsUploadingProfileImage(true);
    const result = await pickAndUploadImage(source);
    setIsUploadingProfileImage(false);
    if (!result.ok) {
      if (result.error !== "cancelled") Alert.alert("사진을 올리지 못했어요", result.error);
      return;
    }
    setProfileImageUrl(result.url);
    setProfileMediaId(result.mediaId);
    setProfileImageChanged(true);
  };

  const openProfileImageMenu = () => {
    Alert.alert("프로필 사진", "사진을 선택해주세요.", [
      { text: "사진 보관함", onPress: () => void uploadProfileImage("gallery") },
      { text: "카메라", onPress: () => void uploadProfileImage("camera") },
      ...(profileImageUrl
        ? [{ text: "사진 삭제", style: "destructive" as const, onPress: () => {
            setProfileImageUrl(null);
            setProfileMediaId(null);
            setProfileImageChanged(true);
          } }]
        : []),
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleSaveNickname = async () => {
    const value = nickname.trim();
    const nicknameChanged = value !== profile?.nickname;
    if (!isValidNickname(value)) {
      Alert.alert("닉네임을 확인해주세요", "2~30자의 한글, 영문, 숫자, 공백만 사용할 수 있어요.");
      return;
    }
    if ((!nicknameChanged && !profileImageChanged) || isSavingNickname) return;

    setIsSavingNickname(true);
    try {
      if (nicknameChanged && !(await nicknamesApi.check(value))) {
        Alert.alert("사용 중인 닉네임이에요", "다른 닉네임을 입력해주세요.");
        return;
      }
      const updatedProfile = await updateProfile({
        ...(nicknameChanged ? { nickname: value } : {}),
        ...(profileImageChanged ? { profileMediaId } : {}),
      });
      queryClient.setQueryData(["profile", "me"], updatedProfile);
      setNicknameModalVisible(false);
      Alert.alert("프로필을 변경했어요");
    } catch {
      Alert.alert("프로필을 변경하지 못했어요", "잠시 후 다시 시도해주세요.");
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
  const avatarColors = getAvatarColors(profile?.id ?? displayName);
  const displayProfileImageUrl = normalizeImageUrl(profile?.profileImageUrl);
  const draftProfileImageUrl = normalizeImageUrl(profileImageUrl);
  const hasProfileChanges = nickname.trim() !== profile?.nickname || profileImageChanged;

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
        <View style={styles.userCard}>
          <View style={styles.profileTop}>
            <View style={[styles.avatarWrap, { backgroundColor: avatarColors.backgroundColor }]}>
              {displayProfileImageUrl ? (
                <Image source={{ uri: displayProfileImageUrl }} style={styles.profileImage} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: avatarColors.color }]}>{avatarText}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.username} numberOfLines={1}>{displayName}</Text>
                {xpWallet ? (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lv.{xpWallet.currentLevel}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.profileSub} numberOfLines={1}>
                {profile?.email ?? "함뜨와 함께 뜨는 중"}
              </Text>
            </View>
          </View>

          <View style={styles.profileFacts}>
            <View style={styles.profileFactRow}>
              <Ionicons name="calendar-outline" size={20} color={INK2} />
              <Text style={styles.profileFactText}>
                {profile?.createdAt
                  ? `${new Date(profile.createdAt).toLocaleDateString("ko-KR")} 가입`
                  : "가입일 정보 없음"}
              </Text>
            </View>
            <View style={styles.profileFactRow}>
              <Ionicons name="sparkles-outline" size={20} color={INK2} />
              <Text style={styles.profileFactText}>
                {xpWallet ? `뜨개 레벨 ${xpWallet.currentLevel} · XP ${xpWallet.totalXp}` : "뜨개 기록을 모으는 중"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileEditButton}
            onPress={openNicknameModal}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="프로필 수정"
          >
            <Text style={styles.profileEditButtonText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recordCard}>
          <Text style={styles.recordTitle}>나의 뜨개 기록</Text>
          {xpWallet ? (
            <View style={styles.xpRow}>
              <View style={styles.xpLabels}>
                <Text style={styles.xpLabel}>레벨 {xpWallet.currentLevel}</Text>
                <Text style={styles.xpNext}>
                  XP {xpWallet.totalXp} / {xpWallet.nextLevelThreshold ?? "-"}
                </Text>
              </View>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${xpPct}%` as any }]} />
              </View>
              {typeof xpWallet.nextLevelThreshold === "number" ? (
                <Text style={styles.xpGuide}>
                  다음 레벨까지 {Math.max(xpWallet.nextLevelThreshold - xpWallet.totalXp, 0)} XP 남았어요
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>보유 포인트</Text>
              <Text style={styles.statValue}>
                {pointsWallet ? pointsWallet.balance.toLocaleString() : "-"}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>완료한 인증</Text>
              <Text style={[styles.statValue, styles.statValueOrange]}>{myChallenges.length}</Text>
            </View>
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

        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>설정</Text>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => setFeedbackModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="의견함 열기"
          >
            <View style={styles.settingsRowLabel}>
              <Ionicons name="chatbubble-ellipses-outline" size={21} color={INK2} />
              <Text style={styles.feedbackBtnText}>의견함</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={INK3} />
          </TouchableOpacity>
          <View style={styles.settingsDivider} />
          <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
            <View style={styles.settingsRowLabel}>
              <Ionicons name="log-out-outline" size={21} color="#E5484D" />
              <Text style={styles.logoutBtnText}>로그아웃</Text>
            </View>
          </TouchableOpacity>
        </View>
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
              <Text style={styles.feedbackTitle}>어떤 점을 바꿔볼까요?</Text>
              <Text style={styles.feedbackDescription}>함뜨가 더 좋아질 수 있도록 편하게 들려주세요.</Text>
            </View>
            <TouchableOpacity
              style={styles.feedbackCloseBtn}
              onPress={() => setFeedbackModalVisible(false)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="의견함 닫기"
            >
              <Ionicons name="close" size={23} color={INK2} />
            </TouchableOpacity>
          </View>
          <View style={styles.feedbackForm}>
            <View style={styles.feedbackInputCard}>
              <TextInput
                style={styles.feedbackInput}
                value={feedback}
                onChangeText={setFeedback}
                placeholder="불편했던 점이나 있었으면 하는 기능을 적어주세요"
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
                <Text style={styles.feedbackSubmitText}>의견 보내기</Text>
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
            <Text style={styles.modalTitle}>프로필 수정</Text>
            <TouchableOpacity
              style={styles.profileImageEditor}
              onPress={openProfileImageMenu}
              disabled={isUploadingProfileImage || isSavingNickname}
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 변경"
            >
              <View style={[styles.profileImagePreview, { backgroundColor: avatarColors.backgroundColor }]}>
                {isUploadingProfileImage ? (
                  <ActivityIndicator color={PRIMARY} />
                ) : draftProfileImageUrl ? (
                  <Image source={{ uri: draftProfileImageUrl }} style={styles.profileImage} resizeMode="cover" />
                ) : (
                  <Text style={[styles.profileImagePreviewText, { color: avatarColors.color }]}>{nickname.slice(0, 2) || avatarText}</Text>
                )}
              </View>
              <View style={styles.profileCameraBadge}>
                <Ionicons name="camera" size={17} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageHint}>사진을 눌러 변경하거나 삭제할 수 있어요</Text>
            <Text style={styles.nicknameLabel}>닉네임</Text>
            <TextInput
              style={styles.nicknameInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor={INK3}
              maxLength={30}
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
                  (!isValidNickname(nickname) || !hasProfileChanges || isSavingNickname || isUploadingProfileImage) &&
                    styles.feedbackSubmitBtnDisabled,
                ]}
                onPress={handleSaveNickname}
                disabled={!isValidNickname(nickname) || !hasProfileChanges || isSavingNickname || isUploadingProfileImage}
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
  container: { flex: 1, backgroundColor: "#F4F5F7" },
  content: { paddingTop: 16, paddingBottom: 130 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 24,
  },
  profileTop: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: PRIMARY_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  profileImage: { width: "100%", height: "100%" },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY_DEEP,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    marginBottom: 6,
  },
  username: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "800",
    color: INK1,
  },
  profileSub: { fontSize: 13, lineHeight: 19, fontWeight: "600", color: INK3 },
  levelBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  levelText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  profileFacts: { gap: 14, marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: LINE },
  profileFactRow: { minHeight: 24, flexDirection: "row", alignItems: "center", gap: 12 },
  profileFactText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "600", color: INK2 },
  profileEditButton: {
    height: 52, borderRadius: 16, marginTop: 22,
    backgroundColor: "#F2F4F6", alignItems: "center", justifyContent: "center",
  },
  profileEditButtonText: { fontSize: 15, fontWeight: "800", color: INK1 },
  recordCard: {
    marginHorizontal: 20, marginBottom: 12, padding: 20,
    borderRadius: 24, backgroundColor: "#FFFFFF",
  },
  recordTitle: { fontSize: 18, fontWeight: "800", color: INK1, marginBottom: 20 },
  xpRow: { gap: 8 },
  xpLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  xpLabel: { fontSize: 14, color: INK1, fontWeight: "800" },
  xpNext: { fontSize: 12, color: PRIMARY, fontWeight: "700" },
  xpBar: {
    height: 9,
    backgroundColor: "#ECEFF2",
    borderRadius: 999,
    overflow: "hidden",
  },
  xpFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 999 },
  xpGuide: { fontSize: 12, lineHeight: 18, color: INK3, fontWeight: "600" },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginTop: 18,
  },
  statItem: { flex: 1, alignItems: "flex-start", paddingHorizontal: 8 },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: INK1,
  },
  statValueOrange: { color: PRIMARY },
  statLabel: { fontSize: 12, color: INK3, fontWeight: "700", marginBottom: 7 },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#E6DED7",
    marginVertical: 4,
  },
  certSection: { paddingTop: 20, paddingBottom: 20, marginHorizontal: 20, marginBottom: 12, borderRadius: 24, backgroundColor: "#FFFFFF", overflow: "hidden" },
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
    borderRadius: 14,
    overflow: "hidden",
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
  settingsSection: {
    paddingTop: 20,
    paddingBottom: 10,
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  settingsTitle: {
    paddingHorizontal: 20,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: "800",
    color: INK1,
  },
  settingsRow: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsRowLabel: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsDivider: { height: 1, marginLeft: 53, backgroundColor: LINE },
  feedbackBtnText: { fontSize: 15, fontWeight: "700", color: INK1 },
  logoutBtnText: { fontSize: 15, fontWeight: "700", color: "#E5484D" },
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
  feedbackSafeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
  },
  feedbackTitle: { fontSize: 26, lineHeight: 34, fontWeight: "800", color: INK1, letterSpacing: -0.7 },
  feedbackDescription: { marginTop: 8, fontSize: 14, lineHeight: 20, fontWeight: "600", color: INK3 },
  feedbackCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 12,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackForm: { flex: 1, paddingHorizontal: 20, paddingBottom: 14 },
  feedbackInputCard: {
    flex: 1,
    minHeight: 240,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F5F6F8",
  },
  feedbackInput: {
    flex: 1,
    minHeight: 180,
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
  profileImageEditor: {
    alignSelf: "center",
    marginTop: 20,
  },
  profileImagePreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImagePreviewText: {
    fontSize: 24,
    fontWeight: "800",
  },
  profileCameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageHint: {
    marginTop: 9,
    textAlign: "center",
    fontSize: 11,
    color: INK3,
  },
  nicknameLabel: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: "800",
    color: INK2,
  },
  nicknameInput: {
    height: 50,
    marginTop: 8,
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
