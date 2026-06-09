import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { nicknamesApi } from "../services/api";
import { SurveyStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<SurveyStackParamList>;
type NickStatus = "ok" | "duplicate" | "editing" | "loading" | "error";

const MAX_RANDOM = 12;

const FALLBACK_NICKNAMES = [
  "포근한 실뭉치", "따뜻한 바늘", "코코아 뜨개", "솜사탕 코바늘", "햇살 대바늘",
  "폭신한 털실", "모카 뜨개인", "귤빛 바늘땀", "달콤한 실타래", "뭉게구름 코",
  "라벤더 뜨개", "민트 실뭉치", "복숭아 바늘", "하늘빛 코바늘", "눈송이 뜨개",
];

function CheckIcon() { return <Text style={{ fontSize: 13, color: "#4FB17A" }}>✓</Text>; }
function CrossIcon() { return <Text style={{ fontSize: 13, color: "#E55B4B" }}>✕</Text>; }
function InfoIcon() { return <Text style={{ fontSize: 13, color: "#8A8A8A" }}>i</Text>; }

export default function SurveyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [nick, setNick] = useState("");
  const [nickStatus, setNickStatus] = useState<NickStatus>("editing");
  const [isIssued, setIsIssued] = useState(false);
  const [randomCount, setRandomCount] = useState(0);
  const autoIssued = useRef(false);

  const issueMutation = useMutation({
    mutationFn: nicknamesApi.issue,
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
    mutationFn: (nickname: string) => nicknamesApi.register(nickname),
    onSuccess: () => {
      navigation.navigate("SurveyQuestions");
    },
    onError: () => {
      // 등록 실패해도 다음 단계로 진행 (이미 issue로 저장됐을 수 있음)
      navigation.navigate("SurveyQuestions");
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
    ok:       { color: "#4FB17A", icon: <CheckIcon />, msg: "사용 가능한 닉네임이에요" },
    duplicate:{ color: "#E55B4B", icon: <CrossIcon />, msg: "이미 사용 중인 닉네임이에요" },
    editing:  { color: "#8A8A8A", icon: <InfoIcon />,  msg: "2~12자, 특수문자 _ 만 사용 가능" },
    loading:  { color: "#8A8A8A", icon: <InfoIcon />,  msg: "확인 중..." },
    error:    { color: "#FF7325", icon: <InfoIcon />,  msg: "서버 오류 - 그래도 등록해볼 수 있어요" },
  };
  const status = statusConfig[nickStatus];

  const randomExhausted = randomCount >= MAX_RANDOM;

  const handleRandom = () => {
    if (randomExhausted || issueMutation.isPending) return;
    setRandomCount((c) => c + 1);
    issueMutation.mutate();
  };

  const handleNickChange = (text: string) => {
    setNick(text);
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
    registerMutation.mutate(nick.trim());
  };

  const canSubmit = (nickStatus === "ok" || nickStatus === "error") && nick.trim().length >= 2;
  const isSubmitting = registerMutation.isPending;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.navBar} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sparkle}>✱</Text>
        <Text style={styles.headline}>나를 표현할{"\n"}프로필을 만들어요</Text>
        <Text style={styles.sub}>마술봉을 누르면 랜덤 닉네임을 받아와요.{"\n"}최대 {MAX_RANDOM}번까지 시도할 수 있어요.</Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarGlow} />
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🐹</Text>
            </View>
            <TouchableOpacity
              style={[styles.wandBtn, randomExhausted && styles.wandBtnDisabled]}
              onPress={handleRandom}
              activeOpacity={0.85}
              disabled={randomExhausted || issueMutation.isPending}
            >
              {issueMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.wandIcon}>✦</Text>
                  <Text style={styles.wandText}>랜덤</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarHint, randomExhausted && styles.avatarHintWarn]}>
            {randomExhausted
              ? "랜덤 시도 횟수를 모두 사용했어요"
              : `✨ 랜덤 남은 횟수 ${MAX_RANDOM - randomCount}번`}
          </Text>
        </View>

        <View style={styles.nickSection}>
          <View style={styles.nickLabelRow}>
            <Text style={styles.nickLabel}>닉네임</Text>
            <Text style={[styles.nickCount, randomExhausted && { color: "#E55B4B" }]}>
              랜덤 {randomCount} / {MAX_RANDOM}
            </Text>
          </View>

          <View style={[
            styles.nickInputWrap,
            nickStatus === "duplicate" && styles.nickInputDuplicate,
            nickStatus === "editing"   && styles.nickInputEditing,
            nickStatus === "ok"        && styles.nickInputOk,
          ]}>
            <TextInput
              style={styles.nickInput}
              value={nick}
              onChangeText={handleNickChange}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor="#AAAAAA"
              maxLength={12}
              returnKeyType="done"
            />
            {nickStatus === "loading" ? (
              <ActivityIndicator size="small" color="#FF7325" style={{ marginRight: 12 }} />
            ) : nickStatus === "ok" ? (
              <TouchableOpacity
                style={[styles.randSmallBtn, randomExhausted && styles.randSmallBtnDisabled]}
                onPress={handleRandom}
                disabled={randomExhausted || issueMutation.isPending}
              >
                <Text style={styles.randSmallIcon}>↻</Text>
                <Text style={styles.randSmallText}>{randomExhausted ? "소진" : "랜덤"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.checkBtn} onPress={handleCheckDuplicate}>
                <Text style={styles.checkBtnText}>{nickStatus === "error" ? "재시도" : "중복 확인"}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statusRow}>
            {status.icon}
            <Text style={[styles.statusMsg, { color: status.color }]}>{status.msg}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, (!canSubmit || isSubmitting) && styles.startBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.startBtnText}>이 프로필로 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  navBar: { height: 48 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 0 },
  sparkle: { fontSize: 22, color: PRIMARY, fontWeight: "800", marginBottom: 6 },
  headline: { fontSize: 26, fontWeight: "800", color: INK1, letterSpacing: -0.8, lineHeight: 34, marginBottom: 10 },
  sub: { fontSize: 13, color: INK3, lineHeight: 20, marginBottom: 32 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatarWrap: { position: "relative", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarGlow: { position: "absolute", width: 196, height: 196, borderRadius: 98, backgroundColor: "rgba(255,115,37,0.12)" },
  avatarCircle: { width: 148, height: 148, borderRadius: 74, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 80 },
  wandBtn: { position: "absolute", bottom: 0, right: -8, height: 44, paddingHorizontal: 14, paddingLeft: 10, borderRadius: 22, backgroundColor: INK1, borderWidth: 3, borderColor: "#fff", flexDirection: "row", alignItems: "center", gap: 5 },
  wandBtnDisabled: { backgroundColor: "#AAAAAA" },
  wandIcon: { fontSize: 13, color: "#fff" },
  wandText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  avatarHint: { fontSize: 12, color: INK3, fontWeight: "600" },
  avatarHintWarn: { color: "#E55B4B" },
  nickSection: { gap: 0 },
  nickLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  nickLabel: { fontSize: 13, fontWeight: "700", color: INK2 },
  nickCount: { fontSize: 11, color: INK3 },
  nickInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingLeft: 16, paddingRight: 4, paddingVertical: 4, borderWidth: 1.5, borderColor: LINE, gap: 8 },
  nickInputOk: { borderColor: "#4FB17A" },
  nickInputEditing: { borderColor: INK1 },
  nickInputDuplicate: { borderColor: "#E55B4B" },
  nickInput: { flex: 1, height: 40, fontSize: 15, fontWeight: "700", color: INK1, padding: 0 },
  checkBtn: { height: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  checkBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  randSmallBtn: { height: 36, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#F5F5F5", flexDirection: "row", alignItems: "center", gap: 4 },
  randSmallBtnDisabled: { backgroundColor: "#F5F5F5", opacity: 0.5 },
  randSmallIcon: { fontSize: 14, color: INK2 },
  randSmallText: { fontSize: 12, fontWeight: "700", color: INK2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  statusMsg: { fontSize: 12, fontWeight: "600" },
  footer: { padding: 20, paddingBottom: 24 },
  startBtn: { height: 56, borderRadius: 16, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center", shadowColor: PRIMARY_DEEP, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  startBtnDisabled: { backgroundColor: "#D0D0D0", shadowColor: "transparent", elevation: 0 },
  startBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
