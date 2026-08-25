import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { nicknamesApi } from "../services/api";
import { updateProfile, getMyProfile } from "../api/users.api";
import { pickAndUploadImage, type ImageSource } from "../services/imageUpload";
import { useAuthStore } from "../store/authStore";
import { SurveyStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<SurveyStackParamList>;
type NickStatus = "ok" | "duplicate" | "editing" | "loading" | "error";

const MAX_RANDOM = 12;

const FALLBACK_NICKNAMES = [
  "포근한실뭉치", "따뜻한바늘", "코코아뜨개", "솜사탕코바늘", "햇살대바늘",
  "폭신한털실", "모카뜨개인", "귤빛바늘땀", "달콤한실타래", "뭉게구름코",
  "라벤더뜨개", "민트실뭉치", "복숭아바늘", "하늘빛코바늘", "눈송이뜨개",
];

export default function SurveyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const setSurveyRequired = useAuthStore((s) => s.setSurveyRequired);
  const [nick, setNick] = useState("");
  const [nickStatus, setNickStatus] = useState<NickStatus>("editing");
  const [isIssued, setIsIssued] = useState(false);
  const [randomCount, setRandomCount] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileMediaId, setProfileMediaId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const autoIssued = useRef(false);

  // 이미 가입 완료된 유저면 설문 화면 건너뜀
  useEffect(() => {
    getMyProfile().then((profile) => {
      if (profile.surveyCompleted && profile.nickname) {
        queryClient.setQueryData(["profile", "me"], profile);
        setSurveyRequired(false);
      }
    }).catch(() => {});
  }, []);

  const issueMutation = useMutation({
    mutationFn: nicknamesApi.candidates,
    onSuccess: (nickname) => {
      setNick(nickname);
      setNickStatus("ok");
      setIsIssued(true);
    },
    onError: () => {
      const fallback = FALLBACK_NICKNAMES[Math.floor(Math.random() * FALLBACK_NICKNAMES.length)];
      setNick(fallback);
      setNickStatus("editing");
      setIsIssued(false);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ nickname, mediaId }: { nickname: string; mediaId: string | null }) => {
      const profile = await updateProfile({
        nickname,
        ...(mediaId ? { profileMediaId: mediaId } : {}),
      });
      await nicknamesApi.register(nickname).catch(() => {});
      return mediaId ? { ...profile, profileImageUrl, profileMediaId: mediaId } : profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", "me"], profile);
      navigation.navigate("SurveyQuestions");
    },
    onError: () => {
      setNickStatus("error");
    },
  });

  // 화면 진입 시 1회 자동 발급
  useEffect(() => {
    if (!autoIssued.current) {
      autoIssued.current = true;
      setRandomCount(1);
      issueMutation.mutate();
    }
  }, []);

  const statusConfig = {
    ok:        { color: OK,     msg: "사용할 수 있는 닉네임이에요" },
    duplicate: { color: DANGER, msg: "이미 사용 중인 닉네임이에요" },
    editing:   { color: HINT,   msg: "2~30자, 한글·영문·숫자·공백만 가능해요" },
    loading:   { color: HINT,   msg: "확인 중..." },
    error:     { color: PRIMARY,msg: "서버 오류 · 그래도 등록해볼 수 있어요" },
  };
  const status = statusConfig[nickStatus];

  const randomExhausted = randomCount >= MAX_RANDOM;

  const handleRandom = () => {
    if (randomExhausted || issueMutation.isPending) return;
    setRandomCount((c) => c + 1);
    issueMutation.mutate();
  };

  const handleNickChange = (text: string) => {
    const filtered = text.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]/g, "");
    setNick(filtered);
    setNickStatus("editing");
    setIsIssued(false);
  };

  const handleCheckDuplicate = async () => {
    if (!nick.trim()) return;
    setNickStatus("loading");
    try {
      const available = await nicknamesApi.check(nick.trim());
      setNickStatus(available ? "ok" : "duplicate");
      setIsIssued(false);
    } catch {
      setNickStatus("error");
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    registerMutation.mutate({ nickname: nick.trim(), mediaId: profileMediaId });
  };

  const uploadProfileImage = async (source: ImageSource) => {
    setIsUploadingImage(true);
    const result = await pickAndUploadImage(source);
    setIsUploadingImage(false);
    if (!result.ok) {
      if (result.error !== "cancelled") Alert.alert("사진을 올리지 못했어요", result.error);
      return;
    }
    setProfileImageUrl(result.url);
    setProfileMediaId(result.mediaId);
  };

  const openProfileImageMenu = () => {
    Alert.alert("프로필 사진", "사진을 선택해주세요.", [
      { text: "사진 보관함", onPress: () => void uploadProfileImage("gallery") },
      { text: "카메라", onPress: () => void uploadProfileImage("camera") },
      ...(profileImageUrl ? [{
        text: "사진 삭제",
        style: "destructive" as const,
        onPress: () => {
          setProfileImageUrl(null);
          setProfileMediaId(null);
        },
      }] : []),
      { text: "취소", style: "cancel" },
    ]);
  };

  const canSubmit = (nickStatus === "ok" || nickStatus === "error") && (nick ?? "").trim().length >= 2;
  const isSubmitting = registerMutation.isPending || isUploadingImage;

  const borderStyle =
    nickStatus === "duplicate" ? styles.fieldDanger
    : nickStatus === "ok" ? styles.fieldOk
    : nickStatus === "editing" ? styles.fieldFocus
    : null;

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 닉네임 + 취향 질문 4개 */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "20%" }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepText}>1 / 5</Text>
          <Text style={styles.headline}>함뜨에서 어떤 이름으로{"\n"}활동할까요?</Text>
          <Text style={styles.sub}>나중에 마이페이지에서도 바꿀 수 있어요.</Text>

          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarEditor}
              onPress={openProfileImageMenu}
              disabled={isUploadingImage || registerMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 설정"
            >
              <View style={styles.avatarCircle}>
                {isUploadingImage ? (
                  <ActivityIndicator color={PRIMARY} />
                ) : profileImageUrl ? (
                  <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarEmoji}>🐹</Text>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={17} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageHint}>프로필 사진은 선택이에요</Text>
            <TouchableOpacity
              style={[styles.randomPill, randomExhausted && styles.randomPillDisabled]}
              onPress={handleRandom}
              activeOpacity={0.8}
              disabled={randomExhausted || issueMutation.isPending}
            >
              {issueMutation.isPending ? (
                <ActivityIndicator size="small" color={SUB} />
              ) : (
                <Text style={styles.randomPillText}>✨ 랜덤 추천</Text>
              )}
            </TouchableOpacity>
            <Text style={[styles.avatarHint, randomExhausted && styles.avatarHintWarn]}>
              {randomExhausted
                ? "랜덤 시도 횟수를 모두 사용했어요"
                : `남은 횟수 ${MAX_RANDOM - randomCount}번`}
            </Text>
          </View>

          <Text style={styles.fieldLabel}>닉네임</Text>
          <View style={[styles.field, borderStyle]}>
            <TextInput
              style={styles.fieldInput}
              value={nick}
              onChangeText={handleNickChange}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={HINT}
              maxLength={30}
              returnKeyType="done"
            />
            {nickStatus === "loading" ? (
              <ActivityIndicator size="small" color={PRIMARY} style={{ marginRight: 14 }} />
            ) : nickStatus === "ok" ? (
              <TouchableOpacity
                style={[styles.inlineGhostBtn, randomExhausted && { opacity: 0.4 }]}
                onPress={handleRandom}
                disabled={randomExhausted || issueMutation.isPending}
              >
                <Text style={styles.inlineGhostText}>{randomExhausted ? "소진" : "↻ 랜덤"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.inlineBtn} onPress={handleCheckDuplicate}>
                <Text style={styles.inlineBtnText}>{nickStatus === "error" ? "재시도" : "중복확인"}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.statusMsg, { color: status.color }]}>{status.msg}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, (!canSubmit || isSubmitting) && styles.ctaDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.ctaText, (!canSubmit || isSubmitting) && styles.ctaTextDisabled]}>다음</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const INK = "#191F28";
const SUB = "#4E5968";
const HINT = "#8B95A1";
const LINE = "#E5E8EB";
const FILL = "#F2F4F6";
const OK = "#15C47E";
const DANGER = "#F04452";

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },

  progressTrack: { height: 4, backgroundColor: FILL, borderRadius: 2, marginHorizontal: 24, marginTop: 8 },
  progressFill: { height: 4, backgroundColor: PRIMARY, borderRadius: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32 },

  stepText: { fontSize: 13, fontWeight: "700", color: PRIMARY, marginBottom: 12 },
  headline: { fontSize: 28, fontWeight: "800", color: INK, lineHeight: 38, letterSpacing: -0.7 },
  sub: { fontSize: 16, fontWeight: "500", color: HINT, lineHeight: 24, marginTop: 10 },

  avatarSection: { alignItems: "center", marginTop: 36, marginBottom: 36 },
  avatarEditor: { position: "relative" },
  avatarCircle: {
    width: 132, height: 132, borderRadius: 66, backgroundColor: FILL,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarEmoji: { fontSize: 72 },
  cameraBadge: {
    position: "absolute", right: 2, bottom: 2,
    width: 34, height: 34, borderRadius: 17, backgroundColor: PRIMARY,
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff",
  },
  profileImageHint: { fontSize: 13, color: HINT, marginTop: 10, fontWeight: "500" },
  randomPill: {
    marginTop: 16, height: 40, paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: FILL, alignItems: "center", justifyContent: "center", minWidth: 120,
  },
  randomPillDisabled: { opacity: 0.5 },
  randomPillText: { fontSize: 14, fontWeight: "700", color: SUB },
  avatarHint: { fontSize: 13, color: HINT, marginTop: 10, fontWeight: "500" },
  avatarHintWarn: { color: DANGER },

  fieldLabel: { fontSize: 14, fontWeight: "700", color: SUB, marginBottom: 10 },
  field: {
    flexDirection: "row", alignItems: "center",
    height: 58, backgroundColor: FILL, borderRadius: 14,
    paddingLeft: 18, paddingRight: 6,
    borderWidth: 1.5, borderColor: "transparent",
  },
  fieldFocus: { borderColor: "#D1D6DB" },
  fieldOk: { borderColor: OK },
  fieldDanger: { borderColor: DANGER },
  fieldInput: { flex: 1, fontSize: 17, fontWeight: "700", color: INK, padding: 0 },
  inlineBtn: { height: 42, paddingHorizontal: 16, borderRadius: 10, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  inlineBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  inlineGhostBtn: { height: 42, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  inlineGhostText: { fontSize: 14, fontWeight: "700", color: SUB },
  statusMsg: { fontSize: 13, fontWeight: "600", marginTop: 10, marginLeft: 4 },

  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  cta: { height: 56, borderRadius: 14, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  ctaDisabled: { backgroundColor: LINE },
  ctaText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  ctaTextDisabled: { color: HINT },
});
