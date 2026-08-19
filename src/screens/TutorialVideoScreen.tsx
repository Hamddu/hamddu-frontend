import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
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
import Ionicons from "@expo/vector-icons/Ionicons";

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
const MIN_WATCH_SECONDS_TO_COMPLETE = 30;
const DISABLE_YOUTUBE_CAPTIONS_SCRIPT = `
  (function () {
    function disableCaptions(target) {
      if (!target) return;
      if (typeof target.setOption === 'function') {
        target.setOption('captions', 'track', {});
      }
      if (typeof target.unloadModule === 'function') {
        target.unloadModule('captions');
      }
    }

    var originalOnPlayerReady = window.onPlayerReady;
    window.onPlayerReady = function (event) {
      disableCaptions(event.target);
      if (typeof originalOnPlayerReady === 'function') {
        return originalOnPlayerReady(event);
      }
    };

    var attempts = 0;
    var timer = setInterval(function () {
      disableCaptions(window.player);
      attempts += 1;
      if (attempts >= 20) clearInterval(timer);
    }, 500);
  })();
  true;
`;

function timestampToSeconds(timestamp?: string): number {
  const parts = timestamp?.split(":").map(Number);
  if (!parts || parts.length !== 3 || parts.some(Number.isNaN)) return 0;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function secondsToTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  if (hh > 0) {
    return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

export default function TutorialVideoScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const {
    videoId,
    title,
    contentId,
    lastWatchedTimestamp,
    alreadyWatched,
    alreadyCertified,
  } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState(1);
  const [watchRate, setWatchRate] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(timestampToSeconds(lastWatchedTimestamp));
  const [totalDuration, setTotalDuration] = useState(0);
  const [progressTrackWidth, setProgressTrackWidth] = useState(1);
  const totalDurationRef = useRef(0);
  const watchRateRef = useRef(0);
  const currentTimeRef = useRef(timestampToSeconds(lastWatchedTimestamp));
  const lastSavedAtRef = useRef(0);
  const leavingRef = useRef(false);
  const playerRef = useRef<any>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const saveHistory = useMutation({
    mutationFn: watchHistoryApi.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history"] });
    },
  });

  const saveCurrentProgress = async (forceComplete = false) => {
    if (!playerRef.current && !forceComplete) return;

    let currentTime = currentTimeRef.current;
    let totalDuration = totalDurationRef.current;
    if (playerRef.current) {
      const latestDuration: number | null = await playerRef.current.getDuration().catch(() => null);
      if (latestDuration !== null) totalDuration = latestDuration;
      const latestTime: number | null = await playerRef.current.getCurrentTime().catch(() => null);
      if (latestTime !== null) currentTime = latestTime;
    }

    currentTimeRef.current = currentTime;
    setCurrentTime(currentTime);
    totalDuration = Math.max(1, Math.floor(totalDuration || currentTime || 60));
    totalDurationRef.current = totalDuration;
    setTotalDuration(totalDuration);
    const completed = forceComplete || watchRateRef.current >= 100;
    const watchRate = completed
      ? 100
      : Math.min(Math.round((currentTime / totalDuration) * 100), 100);
    watchRateRef.current = watchRate;
    setWatchRate(watchRate);

    await saveHistory.mutateAsync({
      contentId,
      totalDuration,
      lastWatchedTimestamp: secondsToTimestamp(completed ? totalDuration : currentTime),
      watchRate,
    });
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(async () => {
      if (!playerRef.current || !totalDurationRef.current) return;
      const currentTime: number = await playerRef.current.getCurrentTime();
      currentTimeRef.current = currentTime;
      setCurrentTime(currentTime);
      const pct = Math.min(Math.round((currentTime / totalDurationRef.current) * 100), 100);
      watchRateRef.current = pct;
      setWatchRate(pct);
      if (Date.now() - lastSavedAtRef.current > 15000) {
        lastSavedAtRef.current = Date.now();
        saveCurrentProgress().catch(() => {});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (leavingRef.current) return;
      e.preventDefault();
      leavingRef.current = true;
      saveCurrentProgress()
        .catch(() => {})
        .finally(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [comment, setComment] = useState("");
  const [certImage, setCertImage] = useState<{ url: string; mediaId: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const videoHeight = width * (9 / 16);
  const [showScreenshotWarn, setShowScreenshotWarn] = useState(false);
  useScreenshotProtection(() => setShowScreenshotWarn(true));

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
    const latestTime: number | null =
      (await playerRef.current?.getCurrentTime?.().catch(() => null)) ?? null;
    if (latestTime !== null) {
      currentTimeRef.current = latestTime;
      setCurrentTime(latestTime);
    }

    if (!alreadyWatched && currentTimeRef.current < MIN_WATCH_SECONDS_TO_COMPLETE) {
      setToastMessage("영상을 조금만 더 시청해주세요~");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastMessage(""), 2000);
      return;
    }
    await saveCurrentProgress(true).catch(() => {});
    setShowChallengeModal(true);
  };

  const playVideo = () => {
    playerRef.current?.playVideo?.();
    setIsPlaying(true);
  };

  const pauseVideo = () => {
    playerRef.current?.pauseVideo?.();
    setIsPlaying(false);
    saveCurrentProgress().catch(() => {});
  };

  const togglePlayback = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  };

  const changeSpeed = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    playerRef.current?.setPlaybackRate?.(nextSpeed);
  };

  const seekBy = (delta: number) => {
    const total = totalDurationRef.current || totalDuration || 0;
    const nextTime = Math.max(0, Math.min((currentTimeRef.current || 0) + delta, total || Infinity));
    currentTimeRef.current = nextTime;
    setCurrentTime(nextTime);
    playerRef.current?.seekTo(nextTime, true);
  };

  const handleSeekBarPress = (event: GestureResponderEvent) => {
    const total = totalDurationRef.current || totalDuration;
    if (!total) return;
    const ratio = Math.max(0, Math.min(event.nativeEvent.locationX / progressTrackWidth, 1));
    const nextTime = total * ratio;
    currentTimeRef.current = nextTime;
    setCurrentTime(nextTime);
    playerRef.current?.seekTo(nextTime, true);
    saveCurrentProgress().catch(() => {});
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
            return;
          }
          if ("error" in result && result.error !== "cancelled") {
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
            return;
          }
          if ("error" in result && result.error !== "cancelled") {
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

  const progressPct = totalDuration ? Math.min((currentTime / totalDuration) * 100, 100) : watchRate;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 영상 영역 */}
      <View style={[styles.playerContainer, { paddingTop: insets.top }]}>
        {YoutubePlayer ? (
          <YoutubePlayer
              ref={playerRef}
              height={videoHeight}
              width={width}
              videoId={videoId}
              play={isPlaying}
              playbackRate={speed}
              webViewProps={{ injectedJavaScript: DISABLE_YOUTUBE_CAPTIONS_SCRIPT }}
              initialPlayerParams={{
                controls: false,
                rel: false,
                preventFullScreen: true,
                showClosedCaptions: false,
              }}
              onPlaybackRateChange={(nextSpeed: number) => setSpeed(nextSpeed)}
              onChangeState={(state: string) => {
                if (state === "playing") setIsPlaying(true);
                if (state === "paused") {
                  setIsPlaying(false);
                  saveCurrentProgress().catch(() => {});
                }
                if (state === "ended") {
                  setIsPlaying(false);
                  watchRateRef.current = 100;
                  setWatchRate(100);
                  saveCurrentProgress(true).catch(() => {});
                }
              }}
              onReady={() => {
                playerRef.current?.getDuration?.().then((d: number) => {
                  const duration = Math.max(1, Math.floor(d));
                  totalDurationRef.current = duration;
                  setTotalDuration(duration);
                });
                const startAt = timestampToSeconds(lastWatchedTimestamp);
                if (startAt > 0) {
                  currentTimeRef.current = startAt;
                  setCurrentTime(startAt);
                  playerRef.current?.seekTo(startAt, true);
                }
              }}
            />
        ) : (
          <View style={[styles.webPlaceholder, { height: videoHeight }]}>
            <Text style={styles.webPlaceholderText}>모바일에서 확인하세요</Text>
          </View>
        )}

        {!isPlaying && (
          <TouchableOpacity
            style={[styles.pauseOverlay, { top: insets.top, height: videoHeight }]}
            onPress={playVideo}
            activeOpacity={0.85}
          >
            <View style={styles.centerPlayBtn}>
              <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={25} color="#fff" />
        </TouchableOpacity>

        <View style={styles.playerChrome}>
          <TouchableOpacity
            style={styles.seekBtn}
            onPress={() => seekBy(-10)}
            activeOpacity={0.75}
          >
            <Text style={styles.seekText}>-10</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlPlayBtn}
            onPress={togglePlayback}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "일시정지" : "재생"}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#fff" style={!isPlaying ? { marginLeft: 2 } : undefined} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.seekBtn}
            onPress={() => seekBy(10)}
            activeOpacity={0.75}
          >
            <Text style={styles.seekText}>+10</Text>
          </TouchableOpacity>
          <View style={styles.timeColumn}>
            <TouchableOpacity
              style={styles.progressTrack}
              onPress={handleSeekBarPress}
              onLayout={(event) => setProgressTrackWidth(Math.max(1, event.nativeEvent.layout.width))}
              activeOpacity={0.9}
            >
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </TouchableOpacity>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
              <Text style={styles.timeText}>{formatDuration(totalDuration)}</Text>
            </View>
          </View>
          <View style={styles.speedPill}>
            <Text style={styles.speedPillText}>{speed}x</Text>
          </View>
        </View>
      </View>

      {/* 콘텐츠 영역 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.titleEyebrow}>영상 튜토리얼</Text>
          <Text style={styles.videoTitle} onLongPress={() => setShowScreenshotWarn(true)}>{title}</Text>
          <Text style={styles.videoDesc}>
            영상을 따라 천천히 연습해보세요. 처음엔 느리게, 익숙해지면 빠르게!
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View>
              <Text style={styles.cardLabel}>학습 진행률</Text>
              <Text style={styles.progressCardTitle}>
                {progressPct >= 100 ? "모두 시청했어요" : progressPct > 0 ? "이어서 학습해보세요" : "첫 코를 시작해볼까요?"}
              </Text>
            </View>
            <Text style={styles.progressCardValue}>{Math.round(progressPct)}%</Text>
          </View>
          <View style={styles.contentProgressTrack}>
            <View style={[styles.contentProgressFill, { width: `${progressPct}%` as any }]} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>재생 속도</Text>
            <Text style={styles.sectionHint}>내 속도에 맞게 조절하세요</Text>
          </View>
          <View style={styles.speedRow}>
            {SPEEDS.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.speedBtn, speed === s.value && styles.speedBtnActive]}
                onPress={() => changeSpeed(s.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.speedText, speed === s.value && styles.speedTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {alreadyCertified ? (
          <View style={styles.certCompleteCard}>
            <View style={styles.certIconWrap}>
              <Ionicons name="checkmark" size={22} color="#16A36A" />
            </View>
            <View style={styles.certContent}>
              <Text style={styles.certTitle}>인증까지 완료했어요</Text>
              <Text style={styles.certText}>멋진 뜨개 기록이 마이에 저장되어 있어요.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.certCard}>
            <View style={styles.certHeader}>
              <View style={styles.certIconWrap}>
                <Ionicons name="ribbon-outline" size={22} color={PRIMARY} />
              </View>
              <View style={styles.certContent}>
                <Text style={styles.certTitle}>완성한 작품을 인증해보세요</Text>
                <Text style={styles.certText}>인증 사진을 올리면 포인트와 XP를 받을 수 있어요.</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleDone}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="튜토리얼 완료하기"
            >
              <Text style={styles.doneBtnText}>완료하고 인증하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 인증 제출 모달 */}
      {showChallengeModal && <Modal visible transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleSkip} activeOpacity={1} />
          <ScrollView
            style={styles.modalSheet}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            keyboardShouldPersistTaps="handled"
          >
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
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>}

      {/* 스크린샷 감지 경고 */}
      <Modal visible={showScreenshotWarn} transparent animationType="fade">
        <View style={styles.warnOverlay}>
          <View style={styles.warnModal}>
            <Text style={styles.warnIcon}>📵</Text>
            <Text style={styles.warnTitle}>캡처가 감지되었어요</Text>
            <Text style={styles.warnDesc}>
              튜토리얼은 저작권으로 보호되는 콘텐츠입니다.{"\n"}
              캡처 화면을 무단으로 공유하거나 배포할 경우 법적 책임이 발생할 수 있어요.
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

      {!!toastMessage && (
        <View
          pointerEvents="none"
          style={[styles.toast, { bottom: insets.bottom + 28 }]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
  toast: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "86%",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "rgba(26,26,26,0.92)",
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  playerContainer: {
    backgroundColor: "#000",
    width: "100%",
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
  pauseOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  centerPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,115,37,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerChrome: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  controlPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  seekBtn: {
    width: 36,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  seekText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  timeColumn: {
    flex: 1,
    minWidth: 0,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "700",
  },
  speedPill: {
    minWidth: 42,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  speedPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
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
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, backgroundColor: "#F5F6F8" },
  content: { paddingTop: 16, paddingHorizontal: 16 },

  titleSection: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  titleEyebrow: {
    marginBottom: 8,
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },
  videoTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: INK1,
    letterSpacing: -0.4,
    marginBottom: 8,
    lineHeight: 30,
  },
  videoDesc: { fontSize: 14, color: INK3, lineHeight: 21 },

  progressCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  progressCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  cardLabel: { fontSize: 12, fontWeight: "700", color: INK3, marginBottom: 5 },
  progressCardTitle: { fontSize: 16, lineHeight: 22, fontWeight: "800", color: INK1 },
  progressCardValue: { fontSize: 22, lineHeight: 28, fontWeight: "800", color: PRIMARY },
  contentProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F0F1F3",
    overflow: "hidden",
  },
  contentProgressFill: { height: "100%", borderRadius: 4, backgroundColor: PRIMARY },

  section: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  sectionHeading: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: INK1, marginBottom: 4 },
  sectionHint: { fontSize: 12, fontWeight: "600", color: INK3 },
  speedRow: { flexDirection: "row", gap: 8 },
  speedBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F2F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  speedBtnActive: { backgroundColor: PRIMARY },
  speedText: { fontSize: 13, fontWeight: "800", color: INK1 },
  speedTextActive: { color: "#fff" },

  certCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  certCompleteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  certHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  certIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E8",
  },
  certContent: { flex: 1, minWidth: 0 },
  certTitle: {
    marginBottom: 4,
    color: INK1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
  certText: { fontSize: 13, color: INK3, fontWeight: "600", lineHeight: 19 },

  doneBtn: {
    height: 52,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // 인증 모달
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    maxHeight: "86%",
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
