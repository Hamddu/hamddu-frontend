import { Alert } from "react-native";

export async function registerForPushNotifications(): Promise<string | null> {
  return null;
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
