import { Alert, Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { notificationsApi } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let registeredTokenKey: string | null = null;
let registrationPromise: Promise<void> | null = null;

export async function registerForPushNotifications(): Promise<void> {
  if (registrationPromise) return registrationPromise;

  registrationPromise = registerDeviceToken().finally(() => {
    registrationPromise = null;
  });

  return registrationPromise;
}

async function registerDeviceToken(): Promise<void> {
  if (!Device.isDevice || (Platform.OS !== "ios" && Platform.OS !== "android")) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  const finalPermissions = allowsNotifications(currentPermissions)
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();

  if (!allowsNotifications(finalPermissions)) return;

  const devicePushToken = await Notifications.getDevicePushTokenAsync();
  const token = typeof devicePushToken.data === "string" ? devicePushToken.data : "";
  if (!token) return;

  const tokenKey = `${Platform.OS}:${token}`;
  if (registeredTokenKey === tokenKey) return;

  await notificationsApi.registerDeviceToken({
    token,
    platform: Platform.OS,
    provider: devicePushToken.type === "android" ? "fcm" : "apns",
    deviceName: Device.modelName ?? undefined,
  });

  registeredTokenKey = tokenKey;
}

function allowsNotifications(settings: Notifications.NotificationPermissionsStatus): boolean {
  const permission = settings as {
    status?: string;
    ios?: { status?: Notifications.IosAuthorizationStatus };
  };

  return (
    permission.status === "granted" ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
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
