import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { xpApi } from "../services/api";
import { scheduleLevelUpNotification } from "../services/notifications";
import { useAuthStore } from "../store/authStore";

const LEVEL_STORAGE_KEY = "last-known-level";

export function useXpLevelDetection() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const prevLevelRef = useRef<number | null>(null);
  const notifiedLevelsRef = useRef<Set<number>>(new Set());

  const { data: xpWallet } = useQuery({
    queryKey: ["xp", "wallet"],
    queryFn: xpApi.getWallet,
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (!xpWallet) return;

    const currentLevel = xpWallet.currentLevel;

    if (prevLevelRef.current === null) {
      prevLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel > prevLevelRef.current && !notifiedLevelsRef.current.has(currentLevel)) {
      notifiedLevelsRef.current.add(currentLevel);
      scheduleLevelUpNotification(currentLevel, xpWallet.levelLabel);
    }

    prevLevelRef.current = currentLevel;
  }, [xpWallet]);
}

export async function getStoredLevel(): Promise<number | null> {
  try {
    const val = await AsyncStorage.getItem(LEVEL_STORAGE_KEY);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

export async function storeLevel(level: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LEVEL_STORAGE_KEY, String(level));
  } catch {}
}
