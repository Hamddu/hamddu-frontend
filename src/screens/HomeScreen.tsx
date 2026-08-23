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
  PanResponder,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Defs, Mask, Path, type SvgProps } from "react-native-svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import BackgroundHamdde from "../../assets/home/background-hamdde.svg";
import Hat from "../../assets/home/hat.svg";
import Knitting01Active from "../../assets/home/tutorial/knitting/icon/knitting_01_active.svg";
import Knitting01Disabled from "../../assets/home/tutorial/knitting/icon/knitting_01_disabled.svg";
import Knitting02Active from "../../assets/home/tutorial/knitting/icon/knitting_02_active.svg";
import Knitting02Disabled from "../../assets/home/tutorial/knitting/icon/knitting_02_disabled.svg";
import Knitting03Active from "../../assets/home/tutorial/knitting/icon/knitting_03_active.svg";
import Knitting03Disabled from "../../assets/home/tutorial/knitting/icon/knitting_03_disabled.svg";
import Knitting04Active from "../../assets/home/tutorial/knitting/icon/knitting_04_active.svg";
import Knitting04Disabled from "../../assets/home/tutorial/knitting/icon/knitting_04_disabled.svg";
import Knitting05Active from "../../assets/home/tutorial/knitting/icon/knitting_05_active.svg";
import Knitting05Disabled from "../../assets/home/tutorial/knitting/icon/knitting_05_disabled.svg";
import Knitting06Active from "../../assets/home/tutorial/knitting/icon/knitting_06_active.svg";
import Knitting06Disabled from "../../assets/home/tutorial/knitting/icon/knitting_06_disabled.svg";
import Knitting07Active from "../../assets/home/tutorial/knitting/icon/knitting_07_active.svg";
import Knitting07Disabled from "../../assets/home/tutorial/knitting/icon/knitting_07_disabled.svg";
import Knitting01PopActive from "../../assets/home/tutorial/knitting/pop/knitting_01_pop_active.svg";
import Knitting01PopDisabled from "../../assets/home/tutorial/knitting/pop/knitting_01_pop_disabled.svg";
import Knitting02PopActive from "../../assets/home/tutorial/knitting/pop/knitting_02_pop_active.svg";
import Knitting02PopDisabled from "../../assets/home/tutorial/knitting/pop/knitting_02_pop_disabled.svg";
import Knitting03PopActive from "../../assets/home/tutorial/knitting/pop/knitting_03_pop_active.svg";
import Knitting03PopDisabled from "../../assets/home/tutorial/knitting/pop/knitting_03_pop_disabled.svg";
import Knitting04PopActive from "../../assets/home/tutorial/knitting/pop/knitting_04_pop_active.svg";
import Knitting04PopDisabled from "../../assets/home/tutorial/knitting/pop/knitting_04_pop_disabled.svg";
import Knitting05PopActive from "../../assets/home/tutorial/knitting/pop/knitting_05_pop_active.svg";
import Knitting05PopDisabled from "../../assets/home/tutorial/knitting/pop/knitting_05_pop_disabled.svg";
import Knitting06PopActive from "../../assets/home/tutorial/knitting/pop/knitting_06_pop_active.svg";
import Knitting06PopDisabled from "../../assets/home/tutorial/knitting/pop/knitting_06_pop_disabled.svg";
import Knitting07PopActive from "../../assets/home/tutorial/knitting/pop/knitting_07_pop_active.svg";
import Knitting07PopDisabled from "../../assets/home/tutorial/knitting/pop/knitting_07_pop_disabled.svg";
import Crochet01Active from "../../assets/home/tutorial/crochet/icon/crochet_01_active.svg";
import Crochet01Disabled from "../../assets/home/tutorial/crochet/icon/crochet_01_disabled.svg";
import Crochet02Active from "../../assets/home/tutorial/crochet/icon/crochet_02_active.svg";
import Crochet02Disabled from "../../assets/home/tutorial/crochet/icon/crochet_02_disabled.svg";
import Crochet03Active from "../../assets/home/tutorial/crochet/icon/crochet_03_active.svg";
import Crochet03Disabled from "../../assets/home/tutorial/crochet/icon/crochet_03_disabled.svg";
import Crochet04Active from "../../assets/home/tutorial/crochet/icon/crochet_04_active.svg";
import Crochet04Disabled from "../../assets/home/tutorial/crochet/icon/crochet_04_disabled.svg";
import Crochet05Active from "../../assets/home/tutorial/crochet/icon/crochet_05_active.svg";
import Crochet05Disabled from "../../assets/home/tutorial/crochet/icon/crochet_05_disabled.svg";
import Crochet06Active from "../../assets/home/tutorial/crochet/icon/crochet_06_active.svg";
import Crochet06Disabled from "../../assets/home/tutorial/crochet/icon/crochet_06_disabled.svg";
import Crochet07Active from "../../assets/home/tutorial/crochet/icon/crochet_07_active.svg";
import Crochet07Disabled from "../../assets/home/tutorial/crochet/icon/crochet_07_disabled.svg";
import Crochet08Active from "../../assets/home/tutorial/crochet/icon/crochet_08_active.svg";
import Crochet08Disabled from "../../assets/home/tutorial/crochet/icon/crochet_08_disabled.svg";
import Crochet09Active from "../../assets/home/tutorial/crochet/icon/crochet_09_active.svg";
import Crochet09Disabled from "../../assets/home/tutorial/crochet/icon/crochet_09_disabled.svg";
import Crochet01PopActive from "../../assets/home/tutorial/crochet/pop/crochet_01_pop_active.svg";
import Crochet01PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_01_pop_disabled.svg";
import Crochet02PopActive from "../../assets/home/tutorial/crochet/pop/crochet_02_pop_active.svg";
import Crochet02PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_02_pop_disabled.svg";
import Crochet03PopActive from "../../assets/home/tutorial/crochet/pop/crochet_03_pop_active.svg";
import Crochet03PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_03_pop_disabled.svg";
import Crochet04PopActive from "../../assets/home/tutorial/crochet/pop/crochet_04_pop_active.svg";
import Crochet04PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_04_pop_disabled.svg";
import Crochet05PopActive from "../../assets/home/tutorial/crochet/pop/crochet_05_pop_active.svg";
import Crochet05PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_05_pop_disabled.svg";
import Crochet06PopActive from "../../assets/home/tutorial/crochet/pop/crochet_06_pop_active.svg";
import Crochet06PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_06_pop_disabled.svg";
import Crochet07PopActive from "../../assets/home/tutorial/crochet/pop/crochet_07_pop_active.svg";
import Crochet07PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_07_pop_disabled.svg";
import Crochet08PopActive from "../../assets/home/tutorial/crochet/pop/crochet_08_pop_active.svg";
import Crochet08PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_08_pop_disabled.svg";
import Crochet09PopActive from "../../assets/home/tutorial/crochet/pop/crochet_09_pop_active.svg";
import Crochet09PopDisabled from "../../assets/home/tutorial/crochet/pop/crochet_09_pop_disabled.svg";
import CrochetLine from "../../assets/home/tutorial/crochet/line.svg";
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
type TutorialSvg = React.ComponentType<SvgProps>;
const NODE_ICON_SIZE = 122;
const MAP_DESIGN_WIDTH = 405;
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
  "M82 131 C128 96 173 76 223 69 C290 60 354 129 333 205 C315 271 245 246 197 285 C146 326 108 349 64 367 C15 388 22 507 98 548 C145 574 159 516 200 487 C246 455 287 426 333 407";
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface TutorialNodeAsset {
  ActiveIcon: TutorialSvg;
  DisabledIcon: TutorialSvg;
  ActivePop: TutorialSvg;
  DisabledPop: TutorialSvg;
}

interface TutorialNodeLayout {
  iconX: number;
  iconY: number;
  popX: number;
  popY: number;
  popWidth: number;
  popHeight: number;
}

interface Lesson {
  id: string;
  contentId: string;
  title: string;
  state: LessonState;
  pct?: number;
  videoId?: string;
}

const KNITTING_ASSETS: TutorialNodeAsset[] = [
  { ActiveIcon: Knitting01Active, DisabledIcon: Knitting01Disabled, ActivePop: Knitting01PopActive, DisabledPop: Knitting01PopDisabled },
  { ActiveIcon: Knitting02Active, DisabledIcon: Knitting02Disabled, ActivePop: Knitting02PopActive, DisabledPop: Knitting02PopDisabled },
  { ActiveIcon: Knitting03Active, DisabledIcon: Knitting03Disabled, ActivePop: Knitting03PopActive, DisabledPop: Knitting03PopDisabled },
  { ActiveIcon: Knitting04Active, DisabledIcon: Knitting04Disabled, ActivePop: Knitting04PopActive, DisabledPop: Knitting04PopDisabled },
  { ActiveIcon: Knitting05Active, DisabledIcon: Knitting05Disabled, ActivePop: Knitting05PopActive, DisabledPop: Knitting05PopDisabled },
  { ActiveIcon: Knitting06Active, DisabledIcon: Knitting06Disabled, ActivePop: Knitting06PopActive, DisabledPop: Knitting06PopDisabled },
  { ActiveIcon: Knitting07Active, DisabledIcon: Knitting07Disabled, ActivePop: Knitting07PopActive, DisabledPop: Knitting07PopDisabled },
];

const CROCHET_ASSETS: TutorialNodeAsset[] = [
  { ActiveIcon: Crochet01Active, DisabledIcon: Crochet01Disabled, ActivePop: Crochet01PopActive, DisabledPop: Crochet01PopDisabled },
  { ActiveIcon: Crochet02Active, DisabledIcon: Crochet02Disabled, ActivePop: Crochet02PopActive, DisabledPop: Crochet02PopDisabled },
  { ActiveIcon: Crochet03Active, DisabledIcon: Crochet03Disabled, ActivePop: Crochet03PopActive, DisabledPop: Crochet03PopDisabled },
  { ActiveIcon: Crochet04Active, DisabledIcon: Crochet04Disabled, ActivePop: Crochet04PopActive, DisabledPop: Crochet04PopDisabled },
  { ActiveIcon: Crochet05Active, DisabledIcon: Crochet05Disabled, ActivePop: Crochet05PopActive, DisabledPop: Crochet05PopDisabled },
  { ActiveIcon: Crochet06Active, DisabledIcon: Crochet06Disabled, ActivePop: Crochet06PopActive, DisabledPop: Crochet06PopDisabled },
  { ActiveIcon: Crochet07Active, DisabledIcon: Crochet07Disabled, ActivePop: Crochet07PopActive, DisabledPop: Crochet07PopDisabled },
  { ActiveIcon: Crochet08Active, DisabledIcon: Crochet08Disabled, ActivePop: Crochet08PopActive, DisabledPop: Crochet08PopDisabled },
  { ActiveIcon: Crochet09Active, DisabledIcon: Crochet09Disabled, ActivePop: Crochet09PopActive, DisabledPop: Crochet09PopDisabled },
];

const KNITTING_NODE_LAYOUT: TutorialNodeLayout[] = [
  { iconX: 21, iconY: 70, popX: 40, popY: 30, popWidth: 82, popHeight: 50 },
  { iconX: 162, iconY: 8, popX: 183, popY: 116, popWidth: 78, popHeight: 50 },
  { iconX: 272, iconY: 144, popX: 293, popY: 252, popWidth: 78, popHeight: 50 },
  { iconX: 136, iconY: 224, popX: 152, popY: 332, popWidth: 89, popHeight: 50 },
  { iconX: 3, iconY: 306, popX: 4, popY: 265, popWidth: 119, popHeight: 50 },
  { iconX: 139, iconY: 426, popX: 156, popY: 535, popWidth: 89, popHeight: 50 },
  { iconX: 272, iconY: 346, popX: 294, popY: 455, popWidth: 78, popHeight: 50 },
];

const CROCHET_NODE_LAYOUT: TutorialNodeLayout[] = [
  { iconX: 21, iconY: 20, popX: 24, popY: 129, popWidth: 115, popHeight: 54 },
  { iconX: 151, iconY: 72, popX: 166, popY: 33, popWidth: 92, popHeight: 55 },
  { iconX: 276, iconY: 144, popX: 298, popY: 105, popWidth: 78, popHeight: 55 },
  { iconX: 214, iconY: 319, popX: 230, popY: 278, popWidth: 92, popHeight: 55 },
  { iconX: 77, iconY: 245, popX: 92, popY: 353, popWidth: 92, popHeight: 54 },
  { iconX: 13, iconY: 440, popX: 35, popY: 550, popWidth: 78, popHeight: 54 },
  { iconX: 146, iconY: 515, popX: 152, popY: 474, popWidth: 110, popHeight: 55 },
  { iconX: 276, iconY: 590, popX: 282, popY: 548, popWidth: 110, popHeight: 55 },
  { iconX: 69, iconY: 693, popX: 84, popY: 804, popWidth: 92, popHeight: 54 },
];

const CROCHET_LAYOUT_INDEX: Record<string, number> = {
  "매직링 만들기": 0,
  사슬뜨기: 1,
  빼뜨기: 2,
  짧은뜨기: 3,
  이랑뜨기: 4,
  긴뜨기: 5,
  "한길 긴뜨기": 6,
  "두길 긴뜨기": 7,
  팝콘뜨기: 8,
};

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

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [category, setCategory] = useState<Category>("knit");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLessonModalVisible, setIsLessonModalVisible] = useState(false);
  const modalDimOpacity = useRef(new Animated.Value(0)).current;
  const modalSheetY = useRef(new Animated.Value(40)).current;
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
  const heroContentY = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [0, -4],
    extrapolate: "clamp",
  });
  const sheetTranslateY = mapScrollY.interpolate({
    inputRange: [0, HERO_COLLAPSE_DISTANCE],
    outputRange: [0, -(HERO_HEIGHT - HERO_COLLAPSED_HEIGHT)],
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

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
  });
  const { data: tutorials = [], isLoading: tutorialsLoading, isRefetching: tutorialsRefreshing, refetch: refetchTutorials } = useQuery({
    queryKey: ["contents", "tutorials"],
    queryFn: contentsApi.getTutorials,
  });
  const { data: watchHistory = [], refetch: refetchWatchHistory } = useQuery({
    queryKey: ["watch-history"],
    queryFn: watchHistoryApi.getAll,
  });
  const { data: myChallenges = [], refetch: refetchMyChallenges } = useQuery({
    queryKey: ["challenges", "my"],
    queryFn: challengesApi.getMyChallenges,
  });

  const historyMap = Object.fromEntries(
    watchHistory.map((h) => [h.contentId, h]),
  );
  const certifiedContentIds = new Set(
    myChallenges.map((challenge) => challenge.content?.id).filter(Boolean),
  );
  const isCrochet = category === "crochet";

  const lessons = tutorials
    .filter((c) => c.interests === (category === "knit" ? "knitting" : "crochet"))
    .sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER))
    .map((c) => contentToLesson(c, historyMap[c.id]));
  const selectedLesson =
    selectedIndex === null ? null : lessons[selectedIndex] ?? null;
  const selectedHistory = selectedLesson
    ? historyMap[selectedLesson.contentId]
    : undefined;
  const selectedProgress = selectedLesson
    ? selectedLesson.state === "done" || certifiedContentIds.has(selectedLesson.contentId)
      ? 100
      : Math.round(selectedLesson.pct ?? 0)
    : 0;
  const nodeAssets = isCrochet ? CROCHET_ASSETS : KNITTING_ASSETS;
  const nodeLayouts = isCrochet ? CROCHET_NODE_LAYOUT : KNITTING_NODE_LAYOUT;
  const mapBaseHeight = isCrochet ? 880 : 640;
  const mapScale = Math.min(1, (windowWidth - 46) / MAP_DESIGN_WIDTH);
  const mapHeight = mapBaseHeight * mapScale;

  const isUnlocked = (_index: number) => true;

  const openLessonModal = (index: number) => {
    modalDimOpacity.stopAnimation();
    modalSheetY.stopAnimation();
    modalDimOpacity.setValue(0);
    modalSheetY.setValue(40);
    setSelectedIndex(index);
    setIsLessonModalVisible(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(modalDimOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(modalSheetY, {
          toValue: 0,
          damping: 24,
          stiffness: 240,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const finishLessonModalClose = (translateY: number, duration = 180) => {
    Animated.parallel([
      Animated.timing(modalDimOpacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(modalSheetY, {
        toValue: translateY,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLessonModalVisible(false);
      setSelectedIndex(null);
    });
  };

  const closeLessonModal = () => finishLessonModalClose(28);

  const modalPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => {
      const distance = Math.max(0, gesture.dy);
      modalSheetY.setValue(distance);
      modalDimOpacity.setValue(Math.max(0.25, 1 - distance / 360));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 110 || gesture.vy > 0.9) {
        finishLessonModalClose(windowHeight, 220);
        return;
      }
      Animated.parallel([
        Animated.spring(modalSheetY, {
          toValue: 0,
          damping: 24,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(modalDimOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    },
    onPanResponderTerminate: () => {
      Animated.parallel([
        Animated.spring(modalSheetY, {
          toValue: 0,
          damping: 24,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(modalDimOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    },
  });

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

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.hero, { height: HERO_HEIGHT }]}>
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
            {profile?.nickname ? `안녕, ${profile.nickname}님!` : "안녕하세요!"}
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

      <View pointerEvents="none" style={styles.sheetLeftCornerBackdrop} />
      <Animated.View
        style={[
          styles.sheet,
          {
            marginBottom: -(HERO_HEIGHT - HERO_COLLAPSED_HEIGHT),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
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
            {
              minHeight:
                windowHeight + HERO_COLLAPSE_DISTANCE - HERO_COLLAPSED_HEIGHT,
              paddingBottom: insets.bottom + 96,
            },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: mapScrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          refreshControl={
            <RefreshControl
              refreshing={tutorialsRefreshing}
              onRefresh={() => {
                void Promise.all([
                  refetchProfile(),
                  refetchTutorials(),
                  refetchWatchHistory(),
                  refetchMyChallenges(),
                ]);
              }}
              tintColor="#FF7325"
              colors={["#FF7325"]}
            />
          }
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>기초 기법</Text>
            <Text style={styles.sectionCount}>총 {lessons.length}강</Text>
          </View>

          {tutorialsLoading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color={PRIMARY} />
              <Text style={styles.emptyText}>강의를 불러오는 중이에요</Text>
            </View>
          ) : lessons.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>아직 등록된 강의가 없어요</Text>
            </View>
          ) : (
            <View style={[styles.map, { minHeight: mapHeight }]}>
              {isCrochet ? (
                <CrochetLine
                  pointerEvents="none"
                  width={MAP_DESIGN_WIDTH * mapScale}
                  height={744 * mapScale}
                  style={[
                    styles.crochetMapThread,
                    {
                      top: 85 * mapScale,
                      transform: [{ scaleX: -1 }],
                    },
                  ]}
                />
              ) : (
                <Svg
                  pointerEvents="none"
                  style={styles.mapThread}
                  viewBox={`0 0 ${MAP_DESIGN_WIDTH} ${mapBaseHeight}`}
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
              )}
              {lessons.slice(0, nodeLayouts.length).map((lesson, index) => {
                const unlocked = isUnlocked(index);
                const layoutIndex = isCrochet
                  ? CROCHET_LAYOUT_INDEX[lesson.title] ?? index
                  : index;
                const layout = nodeLayouts[layoutIndex];
                const asset = nodeAssets[layoutIndex];
                const completed =
                  lesson.state === "done" ||
                  certifiedContentIds.has(lesson.contentId);
                const NodeIcon = completed ? asset.ActiveIcon : asset.DisabledIcon;
                const NodePop = completed ? asset.ActivePop : asset.DisabledPop;
                const frameTop = Math.min(layout.iconY, layout.popY);
                const frameWidth = Math.max(
                  NODE_ICON_SIZE,
                  layout.popX - layout.iconX + layout.popWidth,
                );
                const frameHeight =
                  Math.max(layout.iconY + NODE_ICON_SIZE, layout.popY + layout.popHeight) -
                  frameTop;
                const popOverlapY = isCrochet
                  ? layout.popY < layout.iconY
                    ? 6
                    : -6
                  : 0;

                return (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[
                      styles.nodeButton,
                      {
                        left: layout.iconX * mapScale,
                        top: frameTop * mapScale,
                        width: frameWidth * mapScale,
                        height: frameHeight * mapScale,
                      },
                    ]}
                    onPress={() => openLessonModal(index)}
                    activeOpacity={0.82}
                  >
                    <NodeIcon
                      width={NODE_ICON_SIZE * mapScale}
                      height={NODE_ICON_SIZE * mapScale}
                      style={[
                        styles.nodeIcon,
                        { top: (layout.iconY - frameTop) * mapScale },
                      ]}
                    />
                    <NodePop
                      width={layout.popWidth * mapScale}
                      height={layout.popHeight * mapScale}
                      style={[
                        styles.nodePop,
                        {
                          left: (layout.popX - layout.iconX) * mapScale,
                          top: (layout.popY - frameTop + popOverlapY) * mapScale,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.ScrollView>
      </Animated.View>

      <Modal
        visible={isLessonModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeLessonModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            pointerEvents="none"
            style={[styles.modalDim, { opacity: modalDimOpacity }]}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closeLessonModal}
            activeOpacity={1}
          />
          {selectedLesson && selectedIndex !== null && (
            <Animated.View
              {...modalPanResponder.panHandlers}
              style={[
                styles.lessonModal,
                {
                  paddingBottom: insets.bottom + 18,
                  transform: [{ translateY: modalSheetY }],
                },
              ]}
            >
              <View style={styles.modalHandle} />
              <View style={styles.modalTopRow}>
                <View style={styles.modalStatusChip}>
                  <Ionicons
                    name={selectedProgress === 100 ? "checkmark-circle" : selectedProgress > 0 ? "play-circle" : "sparkles"}
                    size={16}
                    color={PRIMARY}
                  />
                  <Text style={styles.modalStatusText}>
                    {selectedProgress === 100 ? "학습 완료" : selectedProgress > 0 ? "학습 중" : "새 강의"}
                  </Text>
                </View>
              </View>
              <View style={styles.modalMedia}>
                {selectedLesson.videoId ? (
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${selectedLesson.videoId}/mqdefault.jpg` }}
                    style={styles.modalThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.modalThumb, styles.modalThumbFallback]}>
                    <Ionicons name="videocam-off-outline" size={30} color={INK3} />
                    <Text style={styles.modalThumbFallbackText}>영상 준비중</Text>
                  </View>
                )}
                {selectedLesson.videoId ? (
                  <View style={styles.modalPlayIcon}>
                    <Ionicons name="play" size={20} color="#fff" style={{ marginLeft: 2 }} />
                  </View>
                ) : null}
              </View>
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
              <View style={styles.modalProgressCard}>
                <View style={styles.modalProgressHeader}>
                  <Text style={styles.modalProgressLabel}>학습 진행률</Text>
                  <Text style={styles.modalProgressValue}>{selectedProgress}%</Text>
                </View>
                <View style={styles.modalProgressTrack}>
                  <View style={[styles.modalProgressFill, { width: `${selectedProgress}%` as any }]} />
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.modalStartButton,
                  (!isUnlocked(selectedIndex) || !selectedLesson.videoId) &&
                    styles.modalStartButtonDisabled,
                ]}
                onPress={() => goToLesson(selectedLesson, selectedIndex)}
                disabled={!isUnlocked(selectedIndex) || !selectedLesson.videoId}
                activeOpacity={0.85}
              >
                <Text style={styles.modalStartText}>
                  {!selectedLesson.videoId
                    ? "영상 준비중"
                    : !isUnlocked(selectedIndex)
                      ? "이전 영상 완료 후 열려요"
                      : selectedLesson.state === "progress"
                    ? "이어보기"
                    : selectedLesson.state === "done" ||
                        certifiedContentIds.has(selectedLesson.contentId)
                      ? "다시보기"
                      : "시작하기"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
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
  root: { flex: 1, backgroundColor: CREAM },
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
  sheetLeftCornerBackdrop: {
    position: "absolute",
    left: 0,
    top: HERO_HEIGHT - 4,
    width: 28,
    height: 28,
    backgroundColor: PRIMARY,
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
    overflow: "hidden",
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
    fontSize: 18,
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
  mapLoading: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  mapThread: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },
  crochetMapThread: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  nodeButton: {
    position: "absolute",
    zIndex: 1,
  },
  nodeIcon: {
    position: "absolute",
    left: 0,
  },
  nodePop: {
    position: "absolute",
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
  },
  modalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  lessonModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E3E3E3",
    marginBottom: 10,
  },
  modalTopRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalStatusChip: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF1E8",
  },
  modalStatusText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },
  modalMedia: {
    position: "relative",
    marginBottom: 18,
  },
  modalPlayIcon: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26,26,26,0.78)",
  },
  modalThumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 18,
    backgroundColor: "#F2F2F2",
  },
  modalThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalThumbFallbackText: {
    color: INK3,
    fontSize: 14,
    fontWeight: "800",
  },
  modalTitle: {
    color: INK1,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  modalSub: {
    color: INK3,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    lineHeight: 19,
  },
  modalProgressCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F7F8FA",
  },
  modalProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalProgressLabel: {
    color: INK3,
    fontSize: 13,
    fontWeight: "700",
  },
  modalProgressValue: {
    color: INK1,
    fontSize: 15,
    fontWeight: "800",
  },
  modalProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
  },
  modalProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  modalStartButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  modalStartButtonDisabled: {
    backgroundColor: "#D2D2D2",
  },
  modalStartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
