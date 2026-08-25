import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { xpApi } from "../services/api";
import { scheduleLevelUpNotification } from "../services/notifications";
import { useAuthStore } from "../store/authStore";

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
