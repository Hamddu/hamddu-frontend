import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginWithOAuth } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";

function GoogleIcon() {
  return (
    <Text style={{ fontSize: 18 }}>G</Text>
  );
}

function NaverIcon() {
  return (
    <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>N</Text>
  );
}

export default function LoginScreen() {
  const [loading, setLoading] = useState<"google" | "naver" | null>(null);
  const { setAccessToken, setSurveyRequired } = useAuthStore();

  async function handleLogin(provider: "google" | "naver") {
    setLoading(provider);
    try {
      const { accessToken, surveyRequired } = await loginWithOAuth(provider);
      setAccessToken(accessToken);
      setSurveyRequired(surveyRequired);
    } catch (e: any) {
      Alert.alert("로그인 실패", e.message ?? "다시 시도해주세요.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <SafeAreaView style={styles.flex}>
        {/* 상단: 마스코트 + 로고 + 카피 */}
        <View style={styles.top}>
          {/* 마스코트 */}
          <View style={styles.mascotWrap}>
            <View style={styles.mascotGlow} />
            <View style={styles.mascotCircle}>
              <Text style={styles.mascotEmoji}>🐹</Text>
            </View>
          </View>

          {/* 로고 */}
          <Text style={styles.logo}>
            함<Text style={styles.logoAccent}>뜨</Text>
          </Text>

          {/* 헤드라인 */}
          <Text style={styles.headline}>
            한 코, 한 코,{"\n"}
            <Text style={styles.headlineAccent}>함께 떠요</Text>
          </Text>

          {/* 서브 */}
          <Text style={styles.sub}>
            튜토리얼부터 인증, 카운터까지{"\n"}뜨개에 필요한 모든 것
          </Text>
        </View>

        {/* 하단: 버튼 */}
        <View style={styles.bottom}>
          {/* Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => handleLogin("google")}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === "google" ? (
              <ActivityIndicator size="small" color="#3C4043" />
            ) : (
              <>
                <View style={styles.googleIconWrap}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Google로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Naver */}
          <TouchableOpacity
            style={styles.naverBtn}
            onPress={() => handleLogin("naver")}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === "naver" ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <View style={styles.naverIconWrap}>
                  <Text style={styles.naverIconText}>N</Text>
                </View>
                <Text style={styles.naverBtnText}>네이버로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 약관 */}
          <Text style={styles.terms}>
            가입하면{" "}
            <Text style={styles.termsLink}>이용약관</Text>과{" "}
            <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의하게 돼요
          </Text>
        </View>
      </SafeAreaView>
  );
}

const PRIMARY = "#FF7325";
const INK1 = "#1A1A1A";
const INK3 = "#8A8A8A";

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFF1E4" },
  top: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  mascotWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  mascotGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,115,37,0.15)",
  },
  mascotCircle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  mascotEmoji: { fontSize: 80 },
  logo: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -2.6,
    color: INK1,
    lineHeight: 56,
    marginBottom: 16,
  },
  logoAccent: { color: PRIMARY },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    color: INK1,
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 32,
    marginBottom: 10,
  },
  headlineAccent: { color: PRIMARY },
  sub: {
    fontSize: 13,
    fontWeight: "500",
    color: INK3,
    textAlign: "center",
    lineHeight: 20,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  googleBtn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DADCE0",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C4043",
  },
  naverBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#03C75A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  naverIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  naverIconText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
  naverBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  terms: {
    fontSize: 11,
    color: INK3,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  termsLink: {
    color: INK1,
    fontWeight: "600",
  },
});
