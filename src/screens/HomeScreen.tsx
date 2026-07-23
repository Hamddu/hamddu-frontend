import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Defs, Mask, Path } from "react-native-svg";
import BackgroundHamdde from "../../assets/home/background-hamdde.svg";
import Hat from "../../assets/home/hat.svg";
import ButtonBubble from "../../assets/home/button-bubble.svg";
import ButtonBubbleOff from "../../assets/home/button-bubble-off.svg";
import Button1 from "../../assets/home/button-1.svg";
import Button1Off from "../../assets/home/button-1-off.svg";
import { HomeStackParamList } from "../types/navigation";
import {
  challengesApi,
  contentsApi,
  watchHistoryApi,
  Content,
  WatchHistory,
} from "../services/api";
import { getMyProfile } from "../api/users.api";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type Category = "knit" | "crochet";
type LessonState = "done" | "progress" | "open";
const NODE_BUTTON_SIZE = 112;
const NODE_BUTTON_OFFSET = NODE_BUTTON_SIZE / 2;
const HERO_HEIGHT = 288;
const HERO_COLLAPSED_HEIGHT = 132;
const HERO_COLLAPSE_DISTANCE = 150;
const HERO_LINE_LENGTH = 640;
const HERO_LINE_PATHS = [
  "M456.893 114.661C429.127 83.612 355.99 24.6263 285.579 37.0743C197.565 52.6343 212.331 97.2762 235.473 105.329C258.616 113.382 259.627 67.2117 201.392 35.3432C143.157 3.47473 18.916 -3.85556 -20.6331 6.19371",
  "M457 105C426 69 363 33 298 39C211 47 207 99 232 108C261 119 274 77 218 42C158 6 48 -5 -23 16",
  "M456 116C414 87 360 18 286 35C203 54 227 113 252 100C278 87 243 51 190 31C124 6 47 12 -21 5",
  "M459 98C415 77 367 43 306 51C224 62 213 107 239 107C269 107 257 67 205 35C147 -1 56 6 -24 24",
];
const HERO_STITCHES = [
  { dash: 4, gap: 8 },
  { dash: 5, gap: 8 },
  { dash: 5, gap: 9 },
  { dash: 6, gap: 7 },
];
const MAP_THREAD_PATH =
  "M62 122 C108 112 138 96 190 100 C260 104 320 132 318 204 C317 236 307 248 296 250 C252 270 226 318 170 365 C118 398 82 430 48 482 C8 544 38 628 126 628 C148 628 164 620 172 610 C204 584 246 558 292 540";
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Lesson {
  id: string;
  contentId: string;
  title: string;
  state: LessonState;
  pct?: number;
  videoId?: string;
}

const NODE_LAYOUT = [
  { left: "18%", top: 94 },
  { left: "55%", top: 72 },
  { left: "86%", top: 222 },
  { left: "49%", top: 337 },
  { left: "14%", top: 454 },
  { left: "50%", top: 582 },
  { left: "85%", top: 512 },
];

function getLessonState(history: WatchHistory | undefined): {
  state: LessonState;
  pct?: number;
} {
  if (!history) return { state: "open" };
  if (history.watchRate >= 100) return { state: "done" };
  return { state: "progress", pct: history.watchRate };
}

function contentToLesson(
  content: Content,
  history?: WatchHistory,
): Lesson {
  const { state, pct } = getLessonState(history);
  return {
    id: content.id,
    contentId: content.id,
    title: content.name,
    state,
    pct,
    videoId: content.sourceVideoId ?? undefined,
  };
}

function getBubbleWidth(title: string): number {
  return Math.min(174, Math.max(88, title.length * 15 + 26));
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<Category>("knit");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [heroStitch, setHeroStitch] = useState({
    dash: 5,
    gap: 8,
    offset: 0,
    direction: 1,
    path: HERO_LINE_PATHS[0],
    y: 0,
  });
  const lineDraw = useRef(new Animated.Value(0)).current;
  const mapScrollY = useRef(new Animated.Value(0)).current;
  const heroHeight = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [HERO_HEIGHT, HERO_COLLAPSED_HEIGHT],
    extrapolate: "clamp",
  });
  const heroContentY = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [0, -4],
    extrapolate: "clamp",
  });
  const heroPaddingTop = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [insets.top + 28, insets.top],
    extrapolate: "clamp",
  });
  const heroTitleSize = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [28, 22],
    extrapolate: "clamp",
  });
  const heroTitleLineHeight = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [36, 29],
    extrapolate: "clamp",
  });
  const heroTitleY = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [0, 24],
    extrapolate: "clamp",
  });
  const heroTitleExpandedOpacity = mapScrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const heroTitleCollapsedOpacity = mapScrollY.interpolate({
    inputRange: [35, 95],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const heroSubOpacity = mapScrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const heroDefaultOpacity = mapScrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const heroHatOpacity = mapScrollY.interpolate({
    inputRange: [40, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const heroHatY = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [0, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    let stopped = false;
    let animation: Animated.CompositeAnimation | null = null;

    const draw = () => {
      const stitch = HERO_STITCHES[Math.floor(Math.random() * HERO_STITCHES.length)];
      setHeroStitch({
        ...stitch,
        offset: Math.floor(Math.random() * 14),
        direction: Math.random() > 0.5 ? 1 : -1,
        path: HERO_LINE_PATHS[Math.floor(Math.random() * HERO_LINE_PATHS.length)],
        y: Math.floor(Math.random() * 17) - 8,
      });
      lineDraw.setValue(0);
      animation = Animated.sequence([
        Animated.timing(lineDraw, {
          toValue: 1,
          duration: 2800 + Math.floor(Math.random() * 900),
          useNativeDriver: false,
        }),
        Animated.delay(900 + Math.floor(Math.random() * 700)),
      ]);
      animation.start(({ finished }) => {
        if (finished && !stopped) draw();
      });
    };

    draw();
    return () => {
      stopped = true;
      animation?.stop();
    };
  }, [lineDraw]);

  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });
  const { data: tutorials = [], isLoading: tutorialsLoading } = useQuery({
    queryKey: ["contents", "tutorials"],
    queryFn: contentsApi.getTutorials,
  });
  const { data: watchHistory = [] } = useQuery({
    queryKey: ["watch-history"],
    queryFn: watchHistoryApi.getAll,
  });
  const { data: myChallenges = [] } = useQuery({
    queryKey: ["challenges", "my"],
    queryFn: challengesApi.getMyChallenges,
  });

  const historyMap = Object.fromEntries(
    watchHistory.map((h) => [h.contentId, h]),
  );
  const certifiedContentIds = new Set(
    myChallenges.map((challenge) => challenge.content?.id).filter(Boolean),
  );

  const lessons = tutorials
    .filter((c) => c.interests === (category === "knit" ? "knitting" : "crochet"))
    .map((c) => contentToLesson(c, historyMap[c.id]));
  const selectedLesson =
    selectedIndex === null ? null : lessons[selectedIndex] ?? null;
  const selectedHistory = selectedLesson
    ? historyMap[selectedLesson.contentId]
    : undefined;

  const isUnlocked = (index: number) =>
    index === 0 ||
    lessons[index]?.state !== "open" ||
    lessons[index - 1]?.state === "done" ||
    certifiedContentIds.has(lessons[index - 1]?.contentId);

  const goToLesson = (lesson: Lesson, index: number) => {
    if (!lesson.videoId || !isUnlocked(index)) return;
    setSelectedIndex(null);
    navigation.navigate("TutorialVideo", {
      videoId: lesson.videoId,
      title: lesson.title,
      lessonIndex: index,
      contentId: lesson.contentId,
      lastWatchedTimestamp:
        lesson.state === "progress" ? selectedHistory?.lastWatchedTimestamp : undefined,
      alreadyWatched: lesson.state === "done",
      alreadyCertified: certifiedContentIds.has(lesson.contentId),
    });
  };

  if (tutorialsLoading) {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <ActivityIndicator
          size="large"
          color={PRIMARY}
          style={{ marginTop: 60 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.hero, { height: heroHeight }]}>
        <Animated.View
          style={[
            styles.heroContent,
            { paddingTop: heroPaddingTop, transform: [{ translateY: heroContentY }] },
          ]}
        >
          <View style={styles.heroTitleFrame}>
            <Animated.Text
              style={[
                styles.heroTitle,
                styles.heroTitleLayer,
                { opacity: heroTitleExpandedOpacity },
              ]}
            >
              오늘도 한 코,{"\n"}함께 떠볼까요?
            </Animated.Text>
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.heroTitle,
                styles.heroTitleLayer,
                {
                  opacity: heroTitleCollapsedOpacity,
                  fontSize: heroTitleSize,
                  lineHeight: heroTitleLineHeight,
                  transform: [{ translateY: heroTitleY }],
                },
              ]}
            >
              오늘도 한 코, 함께 떠볼까요?
            </Animated.Text>
          </View>
          <Animated.Text style={[styles.heroSub, { opacity: heroSubOpacity }]}>
            안녕, {profile?.nickname ?? "포근한 햄찌"}님!
          </Animated.Text>
          <Animated.View
            pointerEvents="none"
            style={[styles.heroLine, { transform: [{ translateY: heroStitch.y }] }]}
          >
            <Svg width={520} height={117} viewBox="-36 0 520 117" fill="none">
              <Defs>
                <Mask id="hero-line-draw-mask">
                  <AnimatedPath
                    d={heroStitch.path}
                    stroke="white"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeDasharray={HERO_LINE_LENGTH}
                    strokeDashoffset={lineDraw.interpolate({
                      inputRange: [0, 1],
                      outputRange:
                        heroStitch.direction === 1
                          ? [HERO_LINE_LENGTH, 0]
                          : [-HERO_LINE_LENGTH, 0],
                    })}
                    fill="none"
                  />
                </Mask>
              </Defs>
              <Path
                d={heroStitch.path}
                stroke="white"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={`${heroStitch.dash} ${heroStitch.gap}`}
                strokeDashoffset={heroStitch.offset}
                fill="none"
                opacity={0.2}
                mask="url(#hero-line-draw-mask)"
              />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.heroHamdde, { opacity: heroDefaultOpacity }]}>
            <BackgroundHamdde width={242} height={266} />
          </Animated.View>
          <Animated.View
            style={[
              styles.heroHat,
              { opacity: heroHatOpacity, transform: [{ translateY: heroHatY }] },
            ]}
          >
            <Hat width={52} height={45} />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      <View style={styles.sheet}>
        <View style={styles.sheetTabs}>
          <View pointerEvents="none" style={styles.sheetTabsTopBackground} />
          <View style={styles.segment}>
            {(
              [
                { k: "knit", label: "대바늘" },
                { k: "crochet", label: "코바늘" },
              ] as { k: Category; label: string }[]
            ).map((item) => (
              <TouchableOpacity
                key={item.k}
                style={[
                  styles.segmentButton,
                  category === item.k && styles.segmentButtonActive,
                ]}
                onPress={() => {
                  setCategory(item.k);
                  setSelectedIndex(null);
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.segmentText,
                    category === item.k && styles.segmentTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.ScrollView
          style={styles.mapScroll}
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: mapScrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>기초 기법</Text>
            <Text style={styles.sectionCount}>총 {lessons.length}강</Text>
          </View>

          {lessons.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>아직 등록된 강의가 없어요</Text>
            </View>
          ) : (
            <View style={styles.map}>
              <Svg
                pointerEvents="none"
                style={styles.mapThread}
                viewBox="0 0 344 700"
                preserveAspectRatio="none"
              >
                <Path
                  d={MAP_THREAD_PATH}
                  stroke="#E9DFD7"
                  strokeWidth={24}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d={MAP_THREAD_PATH}
                  stroke="#C4BDB7"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 12"
                  fill="none"
                />
              </Svg>
              {lessons.slice(0, NODE_LAYOUT.length).map((lesson, index) => {
                const unlocked = isUnlocked(index);
                const layout = NODE_LAYOUT[index];
                const completed =
                  lesson.state === "done" ||
                  certifiedContentIds.has(lesson.contentId);
                const ButtonIcon = completed ? Button1 : Button1Off;
                const BubbleIcon = completed ? ButtonBubble : ButtonBubbleOff;
                const bubbleWidth = getBubbleWidth(lesson.title);
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[
                      styles.nodeSvgButton,
                      {
                        left: layout.left as any,
                        top: layout.top - 48,
                      },
                    ]}
                    onPress={() => setSelectedIndex(index)}
                    activeOpacity={0.82}
                  >
                    <ButtonIcon
                      width={NODE_BUTTON_SIZE}
                      height={NODE_BUTTON_SIZE}
                      style={styles.nodeSvg}
                    />
                    <View
                      style={[
                        styles.nodeBubble,
                        !completed && styles.nodeBubbleOff,
                        { width: bubbleWidth },
                      ]}
                    >
                      <BubbleIcon
                        width={bubbleWidth}
                        height={completed ? 55 : 54}
                        style={styles.nodeBubbleSvg}
                      />
                      <Text
                        style={[
                          styles.nodeBubbleText,
                          !completed && styles.nodeBubbleTextOff,
                          completed && styles.nodeBubbleTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {lesson.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.ScrollView>
      </View>

      <Modal
        visible={!!selectedLesson}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedIndex(null)}
            activeOpacity={1}
          />
          {selectedLesson && selectedIndex !== null && (
            <View style={[styles.lessonModal, { paddingBottom: insets.bottom + 18 }]}>
              <View style={styles.modalHandle} />
              {selectedLesson.videoId ? (
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${selectedLesson.videoId}/mqdefault.jpg` }}
                  style={styles.modalThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.modalThumb, styles.modalThumbFallback]}>
                  <Text style={styles.modalThumbFallbackText}>영상 준비중</Text>
                </View>
              )}
              <Text style={styles.modalTitle}>{selectedLesson.title}</Text>
              <Text style={styles.modalSub}>
                {isUnlocked(selectedIndex)
                  ? certifiedContentIds.has(selectedLesson.contentId)
                    ? "이미 인증을 제출한 영상이에요"
                    : selectedLesson.state === "progress"
                    ? "보던 곳부터 이어서 볼 수 있어요"
                    : selectedLesson.state === "done"
                      ? "완료한 영상이에요"
                      : "영상 튜토리얼을 시작해보세요"
                  : "이전 영상을 완료하면 열려요"}
              </Text>
              <View style={styles.modalProgressTrack}>
                <View
                  style={[
                    styles.modalProgressFill,
                    { width: `${selectedLesson.state === "done" ? 100 : selectedLesson.pct ?? 0}%` as any },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.modalStartButton,
                  !isUnlocked(selectedIndex) && styles.modalStartButtonDisabled,
                ]}
                onPress={() => goToLesson(selectedLesson, selectedIndex)}
                disabled={!isUnlocked(selectedIndex)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalStartText}>
                  {selectedLesson.state === "progress"
                    ? "이어보기"
                    : selectedLesson.state === "done" ||
                        certifiedContentIds.has(selectedLesson.contentId)
                      ? "다시보기"
                      : "시작하기"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const PRIMARY = "#FF7326";
const CREAM = "#FFF8F2";
const CREAM_LINE = "#EFE6DF";
const INK1 = "#1A1A1A";
const INK3 = "#8A8A8A";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PRIMARY },
  loadingSafeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  hero: {
    backgroundColor: PRIMARY,
    overflow: "hidden",
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 23,
    overflow: "hidden",
  },
  heroTitleFrame: {
    height: 72,
    width: "100%",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 36,
    letterSpacing: -0.9,
  },
  heroTitleLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  heroSub: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    letterSpacing: -0.3,
  },
  heroLine: {
    position: "absolute",
    left: -2,
    top: 55,
  },
  heroHamdde: {
    position: "absolute",
    right: -6,
    bottom: -66,
  },
  heroHat: {
    position: "absolute",
    right: 18,
    bottom: 16,
  },
  sheet: {
    flex: 1,
    marginTop: -4,
    backgroundColor: CREAM,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: CREAM_LINE,
  },
  sheetTabs: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 23,
    zIndex: 2,
  },
  sheetTabsTopBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 39,
    backgroundColor: CREAM,
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
  },
  mapScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingTop: 76,
    paddingHorizontal: 23,
  },
  segment: {
    flexDirection: "row",
    height: 46,
    borderRadius: 999,
    padding: 3,
    backgroundColor: "#F0E6DF",
  },
  segmentButton: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#fff",
  },
  segmentText: {
    color: INK1,
    opacity: 0.5,
    fontSize: 19,
    fontWeight: "800",
  },
  segmentTextActive: {
    opacity: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: INK1,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  sectionCount: {
    color: INK1,
    opacity: 0.5,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  map: {
    minHeight: 700,
    position: "relative",
  },
  mapThread: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: 700,
  },
  nodeSvgButton: {
    position: "absolute",
    width: NODE_BUTTON_SIZE,
    height: 164,
    transform: [{ translateX: -NODE_BUTTON_OFFSET }],
    zIndex: 1,
  },
  nodeSvg: {
    position: "absolute",
    left: 0,
    top: 20,
  },
  nodeBubble: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 82,
    height: 55,
    alignItems: "center",
    paddingTop: 7,
  },
  nodeBubbleOff: {
    width: 78,
    height: 54,
    top: 104,
    paddingTop: 27,
  },
  nodeBubbleSvg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  nodeBubbleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  nodeBubbleTextOff: {
    color: "#C4BDB7",
  },
  nodeBubbleTextActive: {
    color: "#fff",
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: INK3,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  lessonModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E3E3E3",
    marginBottom: 16,
  },
  modalThumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    marginBottom: 16,
  },
  modalThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalThumbFallbackText: {
    color: INK3,
    fontSize: 14,
    fontWeight: "800",
  },
  modalTitle: {
    color: INK1,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  modalSub: {
    color: INK3,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  modalProgressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
    marginTop: 18,
  },
  modalProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  modalStartButton: {
    height: 52,
    borderRadius: 15,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  modalStartButtonDisabled: {
    backgroundColor: "#D2D2D2",
  },
  modalStartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
