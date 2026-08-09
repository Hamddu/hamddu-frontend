import { Alert, Platform } from "react-native";

export async function registerForPushNotifications(): Promise<void> {
  // ponytail: native notification pods are not linked in the current dev build; re-enable after Expo/Firebase iOS setup is aligned.
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  _data?: Record<string, unknown>,
) {
  Alert.alert(title, body);
}

export async function scheduleLevelUpNotification(
  newLevel: number,
  levelLabel: string | null,
) {
  const title = `🎉 레벨업! Lv.${newLevel}`;
  const body = levelLabel
    ? `${levelLabel}에 도달했어요! 계속해서 뜨개질을 즐겨보세요.`
    : `레벨 ${newLevel}에 도달했어요! 계속해서 뜨개질을 즐겨보세요.`;
  await scheduleLocalNotification(title, body);
}
