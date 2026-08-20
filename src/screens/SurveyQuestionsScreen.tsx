import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { submitSurvey } from "../api/users.api";

const AGE_OPTIONS = [
  { label: "14-18", value: "1418" },
  { label: "19-24", value: "1924" },
  { label: "25-29", value: "2529" },
  { label: "30-34", value: "3034" },
  { label: "35-39", value: "3539" },
  { label: "40-49", value: "4049" },
  { label: "50+", value: "50+" },
];
const GENDER_OPTIONS = [{ label: "여성", value: "F" }, { label: "남성", value: "M" }];
const INTEREST_OPTIONS = [{ label: "🥢 대바늘", value: "knitting" }, { label: "🪝 코바늘", value: "crochet" }];
const ABILITY_OPTIONS = [
  { label: "입문", value: "beginner", desc: "뜨개질이 처음이에요" },
  { label: "초급", value: "intermediate", desc: "기초는 알아요" },
  { label: "중급", value: "advanced", desc: "여러 기법을 알아요" },
  { label: "고급", value: "expert", desc: "뭐든 뜰 수 있어요" },
];

export default function SurveyQuestionsScreen() {
  const { setSurveyRequired } = useAuthStore();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interest, setInterest] = useState("");
  const [ability, setAbility] = useState("");

  const canSubmit = age && gender && interest && ability;

  const submitMutation = useMutation({
    mutationFn: () => submitSurvey({ age, gender, interests: interest, ability }),
    onSuccess: () => setSurveyRequired(false),
    onError: () => Alert.alert("저장 실패", "설문을 저장하지 못했어요. 다시 시도해주세요."),
  });

  return (
    <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
      {/* 진행바 2/2 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "100%" }]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>취향을 알려주세요</Text>
        <Text style={styles.sub}>맞춤 콘텐츠를 추천해드릴게요.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 나이 */}
        <Section title="나이대">
          <View style={styles.chipRow}>
            {AGE_OPTIONS.map((a) => {
              const on = age === a.value;
              return (
                <TouchableOpacity
                  key={a.value}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => setAge(a.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{a.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* 성별 */}
        <Section title="성별">
          <View style={styles.segRow}>
            {GENDER_OPTIONS.map((g) => {
              const on = gender === g.value;
              return (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.seg, on && styles.segOn]}
                  onPress={() => setGender(g.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* 관심 분야 */}
        <Section title="관심 분야">
          <View style={styles.segRow}>
            {INTEREST_OPTIONS.map((i) => {
              const on = interest === i.value;
              return (
                <TouchableOpacity
                  key={i.value}
                  style={[styles.seg, on && styles.segOn]}
                  onPress={() => setInterest(i.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{i.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* 실력 */}
        <Section title="뜨개 실력">
          <View style={styles.abilityGrid}>
            {ABILITY_OPTIONS.map((a) => {
              const on = ability === a.value;
              return (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.abilityCard, on && styles.abilityCardOn]}
                  onPress={() => setAbility(a.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.abilityLabel, on && styles.abilityLabelOn]}>{a.label}</Text>
                  <Text style={[styles.abilityDesc, on && styles.abilityDescOn]}>{a.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => setSurveyRequired(false)}
          disabled={submitMutation.isPending}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cta, (!canSubmit || submitMutation.isPending) && styles.ctaDisabled]}
          onPress={() => submitMutation.mutate()}
          disabled={!canSubmit || submitMutation.isPending}
          activeOpacity={0.9}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.ctaText, (!canSubmit || submitMutation.isPending) && styles.ctaTextDisabled]}>
              시작하기
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const PRIMARY = "#FF7325";
const PRIMARY_SOFT = "#FFF1E9";
const INK = "#191F28";
const SUB = "#4E5968";
const HINT = "#8B95A1";
const LINE = "#E5E8EB";
const FILL = "#F2F4F6";

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },

  progressTrack: { height: 4, backgroundColor: FILL, borderRadius: 2, marginHorizontal: 24, marginTop: 8 },
  progressFill: { height: 4, backgroundColor: PRIMARY, borderRadius: 2 },

  header: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: INK, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: HINT, lineHeight: 22, marginTop: 10 },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 12, gap: 32 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: INK, letterSpacing: -0.3 },

  // 나이 칩
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 42, paddingHorizontal: 18, borderRadius: 21,
    backgroundColor: FILL, alignItems: "center", justifyContent: "center",
  },
  chipOn: { backgroundColor: PRIMARY },
  chipText: { fontSize: 14, fontWeight: "700", color: SUB },
  chipTextOn: { color: "#fff" },

  // 성별/관심
  segRow: { flexDirection: "row", gap: 10 },
  seg: {
    flex: 1, height: 54, borderRadius: 14,
    backgroundColor: FILL, alignItems: "center", justifyContent: "center",
  },
  segOn: { backgroundColor: PRIMARY },
  segText: { fontSize: 15, fontWeight: "700", color: SUB },
  segTextOn: { color: "#fff" },

  // 실력
  abilityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  abilityCard: {
    width: "47.5%", padding: 18, borderRadius: 16,
    backgroundColor: FILL, borderWidth: 1.5, borderColor: "transparent",
  },
  abilityCardOn: { backgroundColor: PRIMARY_SOFT, borderColor: PRIMARY },
  abilityLabel: { fontSize: 16, fontWeight: "700", color: INK, marginBottom: 5 },
  abilityLabelOn: { color: PRIMARY },
  abilityDesc: { fontSize: 13, color: HINT, fontWeight: "500" },
  abilityDescOn: { color: "#E06A1F" },

  // 하단
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 14 },
  skipText: { textAlign: "center", fontSize: 15, fontWeight: "600", color: HINT },
  cta: { height: 56, borderRadius: 14, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  ctaDisabled: { backgroundColor: LINE },
  ctaText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  ctaTextDisabled: { color: HINT },
});
