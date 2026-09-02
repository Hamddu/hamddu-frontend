import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginCharacter from "../../assets/login/character.svg";
import { useRequireLogin } from "../hooks/useRequireLogin";

const PRIMARY = "#FF7325";
const INK = "#191F28";
const HINT = "#8B95A1";

/**
 * 게스트가 계정 기반 탭(홈, 마이)에 들어왔을 때 보여주는 안내 화면.
 * 기능을 숨기지 않고 "로그인하면 쓸 수 있다"는 걸 보여준다.
 */
export default function LoginRequiredScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { exitGuestMode } = useRequireLogin();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <LoginCharacter width={122} height={89} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity
          style={styles.cta}
          onPress={exitGuestMode}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="로그인하기"
        >
          <Text style={styles.ctaText}>로그인하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function HomeLoginRequiredScreen() {
  return (
    <LoginRequiredScreen
      title="로그인하면 강의를 볼 수 있어요"
      description={"뜨개 튜토리얼 영상과 이어보기 기록은\n계정에 저장돼요."}
    />
  );
}

export function ProfileLoginRequiredScreen() {
  return (
    <LoginRequiredScreen
      title="로그인하면 내 활동이 쌓여요"
      description={"내가 쓴 글, 챌린지, 레벨은\n계정에 저장돼요."}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 90,
  },
  title: {
    marginTop: 24,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    color: HINT,
    textAlign: "center",
  },
  cta: {
    marginTop: 28,
    height: 52,
    paddingHorizontal: 40,
    borderRadius: 26,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
