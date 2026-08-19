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
    <SafeAreaView style={styles.flex}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.step}>2 / 2</Text>
        <Text style={styles.title}>취향을 알려주세요</Text>
        <Text style={styles.sub}>맞춤 콘텐츠를 추천해드릴게요</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 나이 */}
        <Section title="나이대">
          <View style={styles.chipRow}>
            {AGE_OPTIONS.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[styles.chip, age === a.value && styles.chipActive]}
                onPress={() => setAge(a.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, age === a.value && styles.chipTextActive]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 성별 */}
        <Section title="성별">
          <View style={styles.segRow}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.seg, gender === g.value && styles.segActive]}
                onPress={() => setGender(g.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.segText, gender === g.value && styles.segTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 관심 분야 */}
        <Section title="관심 분야">
          <View style={styles.segRow}>
            {INTEREST_OPTIONS.map((i) => (
              <TouchableOpacity
                key={i.value}
                style={[styles.seg, interest === i.value && styles.segActive]}
                onPress={() => setInterest(i.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.segText, interest === i.value && styles.segTextActive]}>
                  {i.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* 실력 */}
        <Section title="뜨개 실력">
          <View style={styles.abilityGrid}>
            {ABILITY_OPTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.abilityCard, ability === a.value && styles.abilityCardActive]}
                onPress={() => setAbility(a.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.abilityLabel, ability === a.value && styles.abilityLabelActive]}>
                  {a.label}
                </Text>
                <Text style={[styles.abilityDesc, ability === a.value && styles.abilityDescActive]}>
                  {a.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setSurveyRequired(false)} disabled={submitMutation.isPending}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.startBtn, (!canSubmit || submitMutation.isPending) && styles.startBtnDisabled]}
          onPress={() => submitMutation.mutate()}
          disabled={!canSubmit || submitMutation.isPending}
          activeOpacity={0.85}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.startBtnText}>함뜨 시작하기 🐹</Text>
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
const PRIMARY_DEEP = "#C7521A";
const INK1 = "#1A1A1A";
const INK2 = "#404040";
const INK3 = "#8A8A8A";
const LINE = "#ECECEC";

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  step: { fontSize: 12, fontWeight: "700", color: PRIMARY, letterSpacing: 0.4, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", color: INK1, letterSpacing: -0.8, marginBottom: 6 },
  sub: { fontSize: 13, color: INK3, lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 8, gap: 28 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: INK1, letterSpacing: -0.2 },

  // 나이 칩
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: LINE,
    alignItems: "center", justifyContent: "center",
  },
  chipActive: { backgroundColor: INK1, borderColor: INK1 },
  chipText: { fontSize: 13, fontWeight: "600", color: INK2 },
  chipTextActive: { color: "#fff", fontWeight: "800" },

  // 성별/관심
  segRow: { flexDirection: "row", gap: 8 },
  seg: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: LINE,
    alignItems: "center", justifyContent: "center",
  },
  segActive: { backgroundColor: INK1, borderColor: INK1 },
  segText: { fontSize: 14, fontWeight: "700", color: INK2 },
  segTextActive: { color: "#fff", fontWeight: "800" },

  // 실력
  abilityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  abilityCard: {
    width: "47%", padding: 16, borderRadius: 16,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: LINE,
  },
  abilityCardActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  abilityLabel: { fontSize: 15, fontWeight: "800", color: INK1, marginBottom: 4 },
  abilityLabelActive: { color: "#fff" },
  abilityDesc: { fontSize: 12, color: INK3 },
  abilityDescActive: { color: "rgba(255,255,255,0.8)" },

  // 하단
  footer: { padding: 20, paddingBottom: 24, gap: 12 },
  skipText: { textAlign: "center", fontSize: 14, fontWeight: "700", color: INK3 },
  startBtn: {
    height: 56, borderRadius: 16, backgroundColor: PRIMARY,
    alignItems: "center", justifyContent: "center",
    shadowColor: PRIMARY_DEEP, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  startBtnDisabled: { backgroundColor: "#D0D0D0", shadowColor: "transparent", elevation: 0 },
  startBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
