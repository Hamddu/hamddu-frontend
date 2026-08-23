import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuthStore } from "../store/authStore";
import { submitSurvey } from "../api/users.api";

const AGE_OPTIONS = [
  { label: "14~18세", value: "1418" }, { label: "19~24세", value: "1924" },
  { label: "25~29세", value: "2529" }, { label: "30~34세", value: "3034" },
  { label: "35~39세", value: "3539" }, { label: "40~49세", value: "4049" },
  { label: "50세 이상", value: "50+" },
];
const GENDER_OPTIONS = [{ label: "여성", value: "F" }, { label: "남성", value: "M" }];
const INTEREST_OPTIONS = [
  { label: "대바늘", value: "knitting", desc: "포근한 옷과 소품을 떠요", icon: "needle" as const },
  { label: "코바늘", value: "crochet", desc: "귀여운 인형과 소품을 떠요", icon: "hook" as const },
];
const ABILITY_OPTIONS = [
  { label: "입문", value: "beginner", desc: "이제 막 뜨개를 시작해요" },
  { label: "초급", value: "intermediate", desc: "기초 기법을 알고 있어요" },
  { label: "중급", value: "advanced", desc: "여러 기법과 도안을 활용해요" },
  { label: "고급", value: "expert", desc: "어려운 작품도 자신 있어요" },
];
const TITLES = [
  ["연령대를 알려주세요", "나에게 잘 맞는 콘텐츠를 추천해드릴게요."],
  ["성별을 알려주세요", "함뜨에서 더 나은 경험을 준비하는 데 활용해요."],
  ["어떤 뜨개를 좋아하세요?", "관심 있는 뜨개 콘텐츠를 먼저 보여드릴게요."],
  ["뜨개 실력은 어느 정도인가요?", "지금 실력에 딱 맞는 수업을 추천해드릴게요."],
];

export default function SurveyQuestionsScreen() {
  const navigation = useNavigation();
  const setSurveyRequired = useAuthStore((state) => state.setSurveyRequired);
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interest, setInterest] = useState("");
  const [ability, setAbility] = useState("");
  const values = [age, gender, interest, ability];
  const canContinue = Boolean(values[step]);
  const [title, description] = TITLES[step];

  const submitMutation = useMutation({
    mutationFn: () => submitSurvey({ age, gender, interests: interest, ability }),
    onSuccess: () => setSurveyRequired(false),
    onError: () => Alert.alert("저장하지 못했어요", "잠시 후 다시 시도해주세요."),
  });

  const handleBack = () => step === 0 ? navigation.goBack() : setStep((current) => current - 1);
  const handleContinue = () => {
    if (!canContinue) return;
    if (step < 3) setStep((current) => current + 1);
    else submitMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.topAction} accessibilityLabel="이전 단계">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSurveyRequired(false)} style={styles.topAction}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 2) / 5) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepText}>{step + 2} / 5</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.options}>
          {step === 0 && AGE_OPTIONS.map((option) => (
            <Option key={option.value} label={option.label} selected={age === option.value} onPress={() => setAge(option.value)} />
          ))}
          {step === 1 && GENDER_OPTIONS.map((option) => (
            <Option key={option.value} label={option.label} selected={gender === option.value} onPress={() => setGender(option.value)} />
          ))}
          {step === 2 && INTEREST_OPTIONS.map((option) => (
            <Option key={option.value} label={option.label} description={option.desc} icon={option.icon} selected={interest === option.value} onPress={() => setInterest(option.value)} />
          ))}
          {step === 3 && ABILITY_OPTIONS.map((option) => (
            <Option key={option.value} label={option.label} description={option.desc} selected={ability === option.value} onPress={() => setAbility(option.value)} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, (!canContinue || submitMutation.isPending) && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={!canContinue || submitMutation.isPending}
          activeOpacity={0.85}
        >
          {submitMutation.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>{step === 3 ? "함뜨 시작하기" : "다음"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Option({ label, description, icon, selected, onPress }: {
  label: string; description?: string; icon?: "needle" | "hook"; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      {icon ? (
        <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
          <MaterialCommunityIcons name={icon} size={26} color={selected ? PRIMARY : SUB} />
        </View>
      ) : null}
      <View style={styles.optionCopy}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        {description ? <Text style={styles.optionDescription}>{description}</Text> : null}
      </View>
      <View style={[styles.check, selected && styles.checkSelected]}>{selected ? <Text style={styles.checkText}>✓</Text> : null}</View>
    </TouchableOpacity>
  );
}

const PRIMARY = "#FF7325";
const INK = "#191F28";
const SUB = "#4E5968";
const HINT = "#8B95A1";
const LINE = "#E5E8EB";
const FILL = "#F2F4F6";

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },
  topBar: { height: 52, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topAction: { minWidth: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 38, lineHeight: 40, fontWeight: "300", color: INK },
  skipText: { fontSize: 15, fontWeight: "600", color: HINT },
  progressTrack: { height: 3, marginHorizontal: 24, borderRadius: 2, backgroundColor: FILL },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: PRIMARY },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  stepText: { fontSize: 13, fontWeight: "700", color: PRIMARY, marginBottom: 12 },
  title: { fontSize: 28, lineHeight: 38, fontWeight: "800", color: INK, letterSpacing: -0.7 },
  description: { marginTop: 10, fontSize: 16, lineHeight: 24, fontWeight: "500", color: HINT },
  options: { marginTop: 36, gap: 10 },
  option: { minHeight: 68, paddingHorizontal: 18, paddingVertical: 15, borderRadius: 16, backgroundColor: FILL, borderWidth: 1.5, borderColor: "transparent", flexDirection: "row", alignItems: "center" },
  optionSelected: { backgroundColor: "#FFF4ED", borderColor: PRIMARY },
  optionIcon: { width: 44, height: 44, marginRight: 12, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  optionIconSelected: { backgroundColor: "#FFE5D5" },
  optionCopy: { flex: 1 },
  optionLabel: { fontSize: 17, fontWeight: "700", color: SUB },
  optionLabelSelected: { color: PRIMARY },
  optionDescription: { marginTop: 4, fontSize: 13, lineHeight: 18, fontWeight: "500", color: HINT },
  check: { width: 24, height: 24, marginLeft: 12, borderRadius: 12, backgroundColor: "#D1D6DB", alignItems: "center", justifyContent: "center" },
  checkSelected: { backgroundColor: PRIMARY },
  checkText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, backgroundColor: "#FFFFFF" },
  cta: { height: 56, borderRadius: 16, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  ctaDisabled: { backgroundColor: LINE },
  ctaText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  ctaTextDisabled: { color: HINT },
});
