import { Alert, Platform } from "react-native";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
} from "@react-native-firebase/messaging";
import { notificationsApi } from "./api";

const messaging = getMessaging();

async function sendToken(token: string): Promise<void> {
  await notificationsApi.registerDeviceToken({
    token,
    platform: Platform.OS === "android" ? "android" : "ios",
  });
}

export async function registerForPushNotifications(): Promise<() => void> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return () => {};

  const status = await requestPermission(messaging);
  if (
    status !== AuthorizationStatus.AUTHORIZED &&
    status !== AuthorizationStatus.PROVISIONAL
  ) {
    return () => {};
  }

  await sendToken(await getToken(messaging));
  const stopTokenRefresh = onTokenRefresh(messaging, sendToken);
  const stopForegroundMessages = onMessage(messaging, (message) => {
    if (message.notification) {
      Alert.alert(message.notification.title ?? "Hamddu", message.notification.body);
    }
  });

  return () => {
    stopTokenRefresh();
    stopForegroundMessages();
  };
}

export async function unregisterPushNotifications(): Promise<void> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;
  await notificationsApi.unregisterDeviceToken(await getToken(messaging));
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
