import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  useWindowDimensions,
  StatusBar,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HomeStackParamList } from "../types/navigation";
import { watchHistoryApi, challengesApi } from "../services/api";
import { pickAndUploadImage } from "../services/imageUpload";
import { useScreenshotProtection } from "../hooks/useScreenshotProtection";

const YoutubePlayer =
  Platform.OS !== "web"
    ? require("react-native-youtube-iframe").default
    : null;

type RouteType = RouteProp<HomeStackParamList, "TutorialVideo">;

const SPEEDS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "1.5x", value: 1.5 },
];

export default function TutorialVideoScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { videoId, title, contentId } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState(1);
  const [watchRate, setWatchRate] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const totalDurationRef = useRef(0);
  const watchRateRef = useRef(0);
  const playerRef = useRef<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(async () => {
      if (!playerRef.current || !totalDurationRef.current) return;
      const currentTime: number = await playerRef.current.getCurrentTime();
      const pct = Math.min(Math.round((currentTime / totalDurationRef.current) * 100), 100);
      watchRateRef.current = pct;
      setWatchRate(pct);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [comment, setComment] = useState("");
  const [certImage, setCertImage] = useState<{ url: string; mediaId: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const videoHeight = width * (9 / 16);
  const [showScreenshotWarn, setShowScreenshotWarn] = useState(false);
  useScreenshotProtection(() => setShowScreenshotWarn(true));

  const saveHistory = useMutation({
    mutationFn: watchHistoryApi.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history"] });
    },
  });

  const submitChallenge = useMutation({
    mutationFn: challengesApi.submit,
    onSuccess: (data) => {
      setShowChallengeModal(false);
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      const rewards = [];
      if (data.pointEarned > 0) rewards.push(`+${data.pointEarned} 포인트`);
      if (data.xpEarned > 0) rewards.push(`+${data.xpEarned} XP`);
      const rewardText = rewards.length > 0 ? `\n${rewards.join("  ")}` : "";
      Alert.alert("🎉 인증 완료!", `튜토리얼 인증이 등록됐어요!${rewardText}`, [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setShowChallengeModal(false);
        Alert.alert("이미 인증했어요", "이 튜토리얼은 이미 인증 완료했어요.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("오류", "인증 제출에 실패했어요. 다시 시도해주세요.");
      }
    },
  });

  const handleDone = async () => {
    let rate = watchRateRef.current;

    // 완료 시점의 최신 위치를 한 번 더 가져옴 (실패하면 폴링값 유지)
    if (playerRef.current && totalDurationRef.current) {
      const currentTime: number | null = await playerRef.current.getCurrentTime().catch(() => null);
      if (currentTime !== null) {
        rate = Math.min(Math.round((currentTime / totalDurationRef.current) * 100), 100);
      }
    }

    const totalSec = totalDurationRef.current || 60;
    const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    saveHistory.mutate({
      contentId,
      totalDuration: totalSec,
      lastWatchedTimestamp: `${hh}:${mm}:${ss}`,
      watchRate: rate,
    });
    setShowChallengeModal(true);
  };

  const handlePickImage = () => {
    Alert.alert("사진 추가", "사진을 선택할 방법을 선택하세요.", [
      {
        text: "카메라",
        onPress: async () => {
          setImageUploading(true);
          const result = await pickAndUploadImage("camera");
          setImageUploading(false);
          if (result.ok) {
            setCertImage({ url: result.url, mediaId: result.mediaId });
          } else if (result.error !== "cancelled") {
            Alert.alert("사진 업로드 실패", result.error);
          }
        },
      },
      {
        text: "갤러리",
        onPress: async () => {
          setImageUploading(true);
          const result = await pickAndUploadImage("gallery");
          setImageUploading(false);
          if (result.ok) {
            setCertImage({ url: result.url, mediaId: result.mediaId });
          } else if (result.error !== "cancelled") {
            Alert.alert("사진 업로드 실패", result.error);
          }
        },
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleSubmit = () => {
    submitChallenge.mutate({
      contentId,
      title,
      body: comment.trim() || undefined,
      mediaId: certImage?.mediaId,
    });
  };

  const handleSkip = () => {
    setShowChallengeModal(false);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 영상 영역 */}
      <View style={[styles.playerContainer, { paddingTop: insets.top, height: videoHeight + insets.top }]}>
        {YoutubePlayer ? (
          <YoutubePlayer
              ref={playerRef}
              height={videoHeight}
              width={width}
              videoId={videoId}
              playbackRate={speed}
              onChangeState={(state: string) => {
                if (state === "playing") setIsPlaying(true);
                if (state === "paused") setIsPlaying(false);
                if (state === "ended") {
                  setIsPlaying(false);
                  watchRateRef.current = 100;
                  setWatchRate(100);
                }
              }}
              onReady={(e: any) => {
                e.target?.getDuration?.().then((d: number) => {
                  totalDurationRef.current = d;
                });
              }}
            />
        ) : (
          <View style={[styles.webPlaceholder, { height: videoHeight }]}>
            <Text style={styles.webPlaceholderText}>모바일에서 확인하세요</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 영역 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.videoTitle} onLongPress={() => setShowScreenshotWarn(true)}>{title}</Text>
          <Text style={styles.videoDesc}>
            영상을 따라 천천히 연습해보세요. 처음엔 느리게, 익숙해지면 빠르게!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>재생 속도</Text>
          <View style={styles.speedRow}>
            {SPEEDS.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.speedBtn, speed === s.value && styles.speedBtnActive]}
                onPress={() => setSpeed(s.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.speedText, speed === s.value && styles.speedTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.certBanner}>
          <Text style={styles.certMascot}>🐹</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.certText}>
              영상 완료 후 인증 사진을 올리면 포인트를 받아요!
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>완료하기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 인증 제출 모달 */}
      {showChallengeModal && <Modal visible transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleSkip} activeOpacity={1} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>🏆 인증 제출</Text>
            <Text style={styles.modalSub}>
              완료한 튜토리얼을 인증하고 포인트를 받아요
            </Text>

            {/* 사진 */}
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={handlePickImage}
              disabled={imageUploading}
              activeOpacity={0.8}
            >
              {imageUploading ? (
                <ActivityIndicator color={PRIMARY} />
              ) : certImage ? (
                <Image source={{ uri: certImage.url }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <>
                  <Text style={styles.photoBtnIcon}>📷</Text>
                  <Text style={styles.photoBtnText}>사진 추가 (선택)</Text>
                </>
              )}
            </TouchableOpacity>
            {certImage && (
              <TouchableOpacity onPress={() => setCertImage(null)} style={styles.photoRemoveBtn}>
                <Text style={styles.photoRemoveText}>사진 제거</Text>
              </TouchableOpacity>
            )}

            {/* 한마디 */}
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="한마디 남기기 (선택)"
              placeholderTextColor={INK3}
              maxLength={200}
              multiline
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitChallenge.isPending && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitChallenge.isPending}
              activeOpacity={0.85}
            >
              {submitChallenge.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>제출하기</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>}

      {/* 스크린샷 감지 경고 */}
      <Modal visible={showScreenshotWarn} transparent animationType="fade">
        <View style={styles.warnOverlay}>
          <View style={styles.warnModal}>
            <Text style={styles.warnIcon}>📵</Text>
            <Text style={styles.warnTitle}>캡처가 감지되었어요</Text>
            <Text style={styles.warnDesc}>
              튜토리얼 영상의 캡처는 허용되지 않습니다.{'\n'}
              다시 한 번 더 시도하지 말아주세요!
            </Text>
            <TouchableOpacity
              style={styles.warnBtn}
              onPress={() => setShowScreenshotWarn(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.warnBtnText}>확인했어요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  playerContainer: {
    backgroundColor: "#000",
    width: "100%",
    justifyContent: "flex-end",
  },
  thumbContainer: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbDim: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  customPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  customPlayIcon: {
    fontSize: 24,
    color: "#fff",
    marginLeft: 4,
  },
  webPlaceholder: {
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  webPlaceholderText: { color: "#888", fontSize: 14 },

  backBtn: {
    position: "absolute",
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { color: "#fff", fontSize: 28, lineHeight: 34, marginTop: -2 },

  scroll: { flex: 1 },
  content: { paddingTop: 20, paddingHorizontal: 16 },

  titleSection: { marginBottom: 20 },
  videoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -0.4,
    marginBottom: 6,
    lineHeight: 26,
  },
  videoDesc: { fontSize: 13, color: INK3, lineHeight: 20 },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: INK3, marginBottom: 8 },
  speedRow: { flexDirection: "row", gap: 8 },
  speedBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: LINE,
  },
  speedBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  speedText: { fontSize: 13, fontWeight: "800", color: INK1 },
  speedTextActive: { color: "#fff" },

  certBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 16,
    marginBottom: 20,
    padding: 14,
  },
  certMascot: { fontSize: 32 },
  certText: { fontSize: 13, color: PRIMARY_DEEP, fontWeight: "600", lineHeight: 20 },

  doneBtn: {
    height: 52,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // 인증 모달
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINE,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: INK3,
    marginBottom: 20,
    lineHeight: 18,
  },
  photoBtn: {
    height: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: LINE,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
    marginBottom: 8,
    overflow: "hidden",
  },
  photoBtnIcon: { fontSize: 24, marginBottom: 4 },
  photoBtnText: { fontSize: 13, color: INK3, fontWeight: "600" },
  photoPreview: { width: "100%", height: "100%" },
  photoRemoveBtn: { alignSelf: "flex-end", marginBottom: 12 },
  photoRemoveText: { fontSize: 12, color: "#E55B4B", fontWeight: "600" },
  commentInput: {
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: INK1,
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 16,
    marginTop: 4,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 10,
  },
  submitBtnDisabled: { backgroundColor: "#D0D0D0", shadowColor: "transparent", elevation: 0 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipText: { fontSize: 14, color: INK3, fontWeight: "600" },

  // 스크린샷 경고 모달
  warnOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  warnModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  warnIcon: { fontSize: 48, marginBottom: 12 },
  warnTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E55B4B",
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  warnDesc: {
    fontSize: 14,
    color: INK3,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  warnBtn: {
    height: 48,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  warnBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
