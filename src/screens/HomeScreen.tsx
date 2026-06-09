import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import { contentsApi, pointsApi, watchHistoryApi, Content, WatchHistory } from "../services/api";
import { getMyProfile } from "../api/users.api";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type Category = "knit" | "crochet";
type LessonState = "done" | "progress" | "open";

interface Lesson {
  id: string;
  contentId: string;
  title: string;
  sub: string;
  state: LessonState;
  pct?: number;
  videoId?: string;
  channelName: string;
}

function getLessonState(history: WatchHistory | undefined): { state: LessonState; pct?: number } {
  if (!history) return { state: "open" };
  if (history.watchRate >= 90) return { state: "done" };
  return { state: "progress", pct: history.watchRate };
}

function contentToLesson(content: Content, index: number, history?: WatchHistory): Lesson {
  const { state, pct } = getLessonState(history);
  return {
    id: content.id,
    contentId: content.id,
    title: content.title,
    sub: `${String(index + 1).padStart(2, "0")}`,
    state,
    pct,
    videoId: content.youtubeId ?? undefined,
    channelName: content.channel?.name ?? "",
  };
}

function isKnit(channelName: string) {
  return channelName.includes("대바늘") || channelName.toLowerCase().includes("knit");
}

function LessonCard({ lesson, onPress }: { lesson: Lesson; onPress: () => void }) {
  const done = lesson.state === "done";
  const cur = lesson.state === "progress";

  return (
    <TouchableOpacity
      style={[styles.lessonCard, cur && styles.lessonCardActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[
        styles.lessonIcon,
        done && styles.lessonIconDone,
        cur && styles.lessonIconCur,
      ]}>
        {done ? (
          <Text style={styles.lessonIconCheck}>✓</Text>
        ) : (
          <Text style={styles.lessonIconPlay}>▶</Text>
        )}
      </View>

      <View style={styles.lessonContent}>
        <Text style={styles.lessonSub}>{lesson.sub}</Text>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        {cur && lesson.pct != null && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${lesson.pct}%` as any }]} />
          </View>
        )}
      </View>

      {cur && (
        <View style={styles.resumeTag}>
          <Text style={styles.resumeTagText}>이어보기</Text>
        </View>
      )}
      {done && <Text style={styles.doneText}>완료 ✓</Text>}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [category, setCategory] = useState<Category>("knit");

  const { data: profile } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const { data: pointsWallet } = useQuery({ queryKey: ["points", "wallet"], queryFn: pointsApi.getWallet });
  const { data: tutorials = [], isLoading: tutorialsLoading } = useQuery({
    queryKey: ["contents", "tutorials"],
    queryFn: contentsApi.getTutorials,
  });
  const { data: watchHistory = [] } = useQuery({
    queryKey: ["watch-history"],
    queryFn: watchHistoryApi.getAll,
  });

  const historyMap = Object.fromEntries(watchHistory.map((h) => [h.contentId, h]));

  const knitLessons = tutorials
    .filter((c) => isKnit(c.channel?.name ?? ""))
    .map((c, i) => contentToLesson(c, i, historyMap[c.id]));

  const crochetLessons = tutorials
    .filter((c) => !isKnit(c.channel?.name ?? "") && c.channel != null)
    .map((c, i) => contentToLesson(c, i, historyMap[c.id]));

  // 채널 구분이 안 될 경우 전체를 knit으로 표시
  const allLessons = tutorials.map((c, i) => contentToLesson(c, i, historyMap[c.id]));
  const hasChannelData = tutorials.some((c) => c.channel != null);
  const lessons = hasChannelData
    ? (category === "knit" ? knitLessons : crochetLessons)
    : allLessons;

  const points = pointsWallet?.balance ?? 0;
  const nickname = profile?.nickname ?? "뜨개인";

  const ListHeader = () => (
    <View>
      <View style={styles.heroSection}>
        <Text style={styles.sparkle}>✱</Text>
        <Text style={styles.heroTitle}>
          오늘도 한 코,{"\n"}
          <Text style={styles.heroTitleAccent}>함께 떠볼까요?</Text>
        </Text>
        <Text style={styles.heroSub}>
          안녕, <Text style={styles.heroSubBold}>{nickname}</Text>님 🐹
        </Text>
      </View>

      <View style={styles.hudRow}>
        <View style={[styles.hudCard, styles.hudCardOrange]}>
          <Text style={styles.hudLabel}>POINT</Text>
          <Text style={[styles.hudValue, styles.hudValueOrange]}>
            {points.toLocaleString()} pt
          </Text>
        </View>
        <View style={styles.hudCard}>
          <Text style={styles.hudLabel}>완료 강의</Text>
          <Text style={styles.hudValue}>
            ✓ {allLessons.filter((l) => l.state === "done").length}강
          </Text>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <View style={styles.toggle}>
          <View style={[
            styles.toggleIndicator,
            category === "crochet" && styles.toggleIndicatorRight,
          ]} />
          {([
            { k: "knit", label: "🥢  대바늘" },
            { k: "crochet", label: "🪝  코바늘" },
          ] as { k: Category; label: string }[]).map((r) => (
            <TouchableOpacity
              key={r.k}
              style={styles.toggleBtn}
              onPress={() => setCategory(r.k)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.toggleBtnText,
                category === r.k && styles.toggleBtnTextActive,
              ]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>기초 기법</Text>
        <Text style={styles.sectionCount}>총 {lessons.length}강</Text>
      </View>
    </View>
  );

  if (tutorialsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF7325" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 등록된 강의가 없어요</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <LessonCard
            lesson={item}
            onPress={() => {
              if (item.videoId) {
                navigation.navigate("TutorialVideo", {
                  videoId: item.videoId,
                  title: item.title,
                  lessonIndex: index,
                  contentId: item.contentId,
                });
              }
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={() => <View style={{ height: 20 }} />}
      />
    </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFE6D6";
const INK1 = "#1A1A1A";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  listContent: { paddingHorizontal: 20 },
  heroSection: { paddingTop: 8, paddingBottom: 16 },
  sparkle: { fontSize: 22, color: PRIMARY, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: INK1, letterSpacing: -0.8, lineHeight: 36 },
  heroTitleAccent: { color: PRIMARY },
  heroSub: { fontSize: 14, color: "#404040", marginTop: 8, lineHeight: 20 },
  heroSubBold: { fontWeight: "800", color: INK1 },
  hudRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  hudCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: LINE },
  hudCardOrange: { borderColor: PRIMARY_SOFT },
  hudLabel: { fontSize: 10, fontWeight: "700", color: INK3, letterSpacing: 0.4, marginBottom: 2 },
  hudValue: { fontSize: 18, fontWeight: "800", color: INK1 },
  hudValueOrange: { color: PRIMARY },
  toggleContainer: { marginBottom: 16 },
  toggle: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 12, borderWidth: 1, borderColor: LINE, padding: 3, position: "relative" },
  toggleIndicator: { position: "absolute", top: 3, bottom: 3, left: 3, width: "50%", backgroundColor: INK1, borderRadius: 9 },
  toggleIndicatorRight: { left: "50%" },
  toggleBtn: { flex: 1, height: 36, alignItems: "center", justifyContent: "center", zIndex: 1 },
  toggleBtnText: { fontSize: 13, fontWeight: "700", color: INK3 },
  toggleBtnTextActive: { color: "#fff" },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: INK1 },
  sectionCount: { fontSize: 11, color: INK3, fontWeight: "600" },
  lessonCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: LINE },
  lessonCardActive: { borderWidth: 1.5, borderColor: PRIMARY },
  lessonIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  lessonIconDone: { backgroundColor: PRIMARY },
  lessonIconCur: { backgroundColor: PRIMARY_SOFT },
  lessonIconCheck: { fontSize: 20, color: "#fff", fontWeight: "800" },
  lessonIconPlay: { fontSize: 16, color: PRIMARY, fontWeight: "800" },
  lessonContent: { flex: 1, minWidth: 0 },
  lessonSub: { fontSize: 10, fontWeight: "700", color: INK3, letterSpacing: 0.3, marginBottom: 2 },
  lessonTitle: { fontSize: 15, fontWeight: "800", color: INK1, letterSpacing: -0.2 },
  progressBar: { marginTop: 6, height: 4, backgroundColor: "#F0F0F0", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 2 },
  resumeTag: { backgroundColor: INK1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  resumeTagText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  doneText: { fontSize: 11, fontWeight: "700", color: INK3 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: INK3 },
});
