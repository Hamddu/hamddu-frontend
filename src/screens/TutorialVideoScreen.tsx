import React, { useState, useRef } from "react";
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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HomeStackParamList } from "../types/navigation";
import { watchHistoryApi } from "../services/api";

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
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const totalDurationRef = useRef(0);
  const queryClient = useQueryClient();

  const videoHeight = width * (9 / 16);

  const saveHistory = useMutation({
    mutationFn: watchHistoryApi.save,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history"] });
    },
  });

  const handleDone = () => {
    const rate = Math.max(watchRate, 100);
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
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 영상 영역 */}
      <View style={[styles.playerContainer, { paddingTop: insets.top, height: videoHeight + insets.top }]}>
        {YoutubePlayer ? (
          <View style={{ width, height: videoHeight }}>
            <YoutubePlayer
              height={videoHeight}
              width={width}
              videoId={videoId}
              play={started}
              playbackRate={speed}
              onChangeState={(state: string) => {
                if (state === "playing") setPlaying(true);
                if (state === "ended") setWatchRate(100);
              }}
              onReady={(e: any) => {
                e.target?.getDuration?.().then((d: number) => {
                  totalDurationRef.current = d;
                });
              }}
            />
            {/* 재생 시작 전 썸네일 오버레이 */}
            {!playing && (
              <TouchableOpacity
                style={[styles.thumbContainer, { height: videoHeight, position: "absolute", top: 0, left: 0, right: 0 }]}
                onPress={() => setStarted(true)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  resizeMode="cover"
                />
                <View style={styles.thumbDim} />
                <View style={styles.customPlayBtn}>
                  <Text style={styles.customPlayIcon}>▶</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.webPlaceholder, { height: videoHeight }]}>
            <Text style={styles.webPlaceholderText}>모바일에서 확인하세요</Text>
          </View>
        )}

        {/* 뒤로가기 버튼 오버레이 */}
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
        {/* 제목 */}
        <View style={styles.titleSection}>
          <Text style={styles.videoTitle}>{title}</Text>
          <Text style={styles.videoDesc}>
            영상을 따라 천천히 연습해보세요. 처음엔 느리게, 익숙해지면 빠르게!
          </Text>
        </View>

        {/* 재생 속도 */}
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

        {/* 포인트 안내 배너 */}
        <View style={styles.certBanner}>
          <Text style={styles.certMascot}>🐹</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.certText}>
              영상 완료 후 인증 사진을 올리면 포인트를 받아요!
            </Text>
          </View>
        </View>

        {/* 완료 버튼 */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>완료하기</Text>
        </TouchableOpacity>
      </ScrollView>
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
});
