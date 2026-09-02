import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoginCharacter from "../../assets/login/character.svg";
import LoginFire from "../../assets/login/fire.svg";
import NaverIcon from "../../assets/login/naver.svg";
import YarnBottom from "../../assets/login/yarn-bottom.svg";
import YarnLeft from "../../assets/login/yarn-left.svg";
import YarnTop from "../../assets/login/yarn-top.svg";
import { isAppleLoginAvailable, loginWithApple, loginWithOAuth } from "../api/auth.api";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "../constants/legal";
import { useAuthStore } from "../store/authStore";

const GOOGLE_ICON = require("../../assets/login/google.png");

type Provider = "apple" | "google" | "naver";

export default function LoginScreen() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [legalDocument, setLegalDocument] = useState<"terms" | "privacy" | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const enterGuestMode = useAuthStore((state) => state.enterGuestMode);
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / 451, height / 980);

  // iOS 13 미만이나 안드로이드에서는 Apple 버튼을 띄우지 않는다.
  useEffect(() => {
    let cancelled = false;
    isAppleLoginAvailable()
      .then((available) => {
        if (!cancelled) setAppleAvailable(available);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(provider: Provider) {
    setLoading(provider);
    try {
      const { accessToken, refreshToken, surveyRequired } =
        provider === "apple" ? await loginWithApple() : await loginWithOAuth(provider);
      setSession(accessToken, refreshToken, surveyRequired);
    } catch (e: any) {
      // 사용자가 직접 취소한 경우까지 실패 알럿을 띄우지는 않는다.
      if (e?.message !== "로그인이 취소되었습니다.") {
        Alert.alert("로그인 실패", e.message ?? "다시 시도해주세요.");
      }
    } finally {
      setLoading(null);
    }
  }

  const buttonSize = { height: 60 * scale, borderRadius: 30 * scale };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F2" />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.topYarn, { right: -25 * scale, top: 15 * scale }]}>
          <YarnTop width={69 * scale} height={253 * scale} />
        </View>
        <View style={[styles.leftYarn, { left: -15 * scale, top: height * 0.33 }]}>
          <YarnLeft width={140 * scale} height={324 * scale} />
        </View>
        <View style={[styles.bottomYarn, { right: -10 * scale, bottom: -20 * scale }]}>
          <YarnBottom width={83 * scale} height={203 * scale} />
        </View>
      </View>

      <View style={styles.brandArea}>
        <View style={{ width: 178 * scale, height: 173 * scale }}>
          <LoginFire width={178 * scale} height={173 * scale} />
          <View style={[styles.character, { left: 32 * scale, top: 84 * scale }]}>
            <LoginCharacter width={102 * scale} height={74 * scale} />
          </View>
        </View>
        <Text style={[styles.logo, { fontSize: 60 * scale, lineHeight: 72 * scale }]}>함뜨</Text>
        <Text style={[styles.tagline, { fontSize: 24 * scale, lineHeight: 34 * scale }]}>
          한 코 한 코 함께 떠볼까요!
        </Text>
      </View>

      <View style={[styles.actions, { paddingHorizontal: 30 * scale, paddingBottom: 55 * scale, gap: 10 * scale }]}>
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={30 * scale}
            style={buttonSize}
            onPress={() => {
              if (!loading) void handleLogin("apple");
            }}
          />
        )}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="구글로 계속하기"
          activeOpacity={0.82}
          disabled={!!loading}
          onPress={() => handleLogin("google")}
          style={[styles.googleButton, buttonSize]}
        >
          {loading === "google" ? (
            <ActivityIndicator size="small" color="#222222" />
          ) : (
            <>
              <Image
                source={GOOGLE_ICON}
                style={[styles.providerIcon, { left: 22 * scale, width: 22 * scale, height: 23 * scale }]}
              />
              <Text style={[styles.buttonText, { fontSize: 19 * scale }]}>구글로 계속하기</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="네이버로 계속하기"
          activeOpacity={0.82}
          disabled={!!loading}
          onPress={() => handleLogin("naver")}
          style={[styles.naverButton, buttonSize]}
        >
          {loading === "naver" ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <View style={[styles.providerIcon, { left: 22 * scale }]}>
                <NaverIcon width={19 * scale} height={19 * scale} />
              </View>
              <Text style={[styles.buttonText, styles.naverText, { fontSize: 19 * scale }]}>네이버로 계속하기</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="로그인 없이 둘러보기"
          activeOpacity={0.6}
          disabled={!!loading}
          onPress={enterGuestMode}
          style={[styles.guestButton, { height: 52 * scale, marginTop: 6 * scale }]}
        >
          <Text style={[styles.guestButtonText, { fontSize: 17 * scale }]}>로그인 없이 둘러보기</Text>
        </TouchableOpacity>

        <Text style={[styles.terms, { fontSize: 15 * scale, lineHeight: 20 * scale, marginTop: 18 * scale }]}>
          가입하면 <Text accessibilityRole="link" style={styles.termsLink} onPress={() => setLegalDocument("terms")}>이용약관</Text>과{" "}
          <Text accessibilityRole="link" style={styles.termsLink} onPress={() => setLegalDocument("privacy")}>개인정보처리방침</Text>에 동의하게 돼요
        </Text>
      </View>

      <Modal
        visible={legalDocument !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalDocument(null)}
      >
        <SafeAreaView style={styles.legalScreen}>
          <View style={styles.legalHeader}>
            <Text style={styles.legalTitle}>
              {legalDocument === "terms" ? "이용약관" : "개인정보처리방침"}
            </Text>
            <TouchableOpacity
              style={styles.legalCloseButton}
              accessibilityRole="button"
              accessibilityLabel="문서 닫기"
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              onPress={() => setLegalDocument(null)}
            >
              <Ionicons name="close" size={26} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.legalContent}>
            <Text style={styles.legalBody}>
              {legalDocument === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#FFF8F2",
  },
  topYarn: {
    position: "absolute",
    transform: [{ rotate: "-151.16deg" }],
  },
  leftYarn: { position: "absolute" },
  bottomYarn: { position: "absolute" },
  brandArea: {
    zIndex: 1,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  character: { position: "absolute" },
  logo: {
    marginTop: 16,
    color: "#FF7326",
    fontWeight: "900",
    letterSpacing: -2.4,
    textAlign: "center",
  },
  tagline: {
    color: "#A55428",
    fontWeight: "700",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  actions: { zIndex: 1 },
  googleButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE6DF",
  },
  naverButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#03C75A",
  },
  providerIcon: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000000",
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  naverText: { color: "#FFFFFF" },
  guestButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonText: {
    color: "rgba(0,0,0,0.5)",
    fontWeight: "700",
    letterSpacing: -0.4,
    textDecorationLine: "underline",
  },
  terms: {
    color: "rgba(0,0,0,0.3)",
    fontWeight: "500",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  termsLink: {
    color: "rgba(0,0,0,0.55)",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  legalScreen: { flex: 1, backgroundColor: "#FFFFFF" },
  legalHeader: {
    height: 58,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legalTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  legalCloseButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  legalContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 48 },
  legalBody: { fontSize: 14, lineHeight: 23, color: "#404040" },
});
