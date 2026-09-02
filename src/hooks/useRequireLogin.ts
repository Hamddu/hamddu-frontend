import { useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "../store/authStore";

/**
 * 계정이 필요한 동작을 게스트가 눌렀을 때 로그인으로 유도한다.
 *
 * App Store 가이드라인 5.1.1(v)에 맞춰 커뮤니티 읽기와 코카운터는 로그인 없이 열어두되,
 * 글쓰기·댓글·좋아요처럼 계정에 묶이는 동작은 여기서 막고 로그인을 안내한다.
 */
export function useRequireLogin() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const accessToken = useAuthStore((s) => s.accessToken);
  const exitGuestMode = useAuthStore((s) => s.exitGuestMode);

  const isLoggedIn = !!accessToken;

  const promptLogin = useCallback(
    (action: string) => {
      Alert.alert("로그인이 필요해요", `${action} 함뜨 계정으로 로그인해주세요.`, [
        { text: "취소", style: "cancel" },
        { text: "로그인하기", onPress: exitGuestMode },
      ]);
    },
    [exitGuestMode],
  );

  /**
   * 로그인 상태면 true를 돌려주고, 게스트면 안내 후 false를 돌려준다.
   * 호출부는 `if (!requireLogin("글을 쓰려면")) return;` 형태로 쓴다.
   */
  const requireLogin = useCallback(
    (action: string) => {
      if (isLoggedIn) return true;
      promptLogin(action);
      return false;
    },
    [isLoggedIn, promptLogin],
  );

  return { isGuest, isLoggedIn, requireLogin, promptLogin, exitGuestMode };
}
