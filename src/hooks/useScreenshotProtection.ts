import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

export function useScreenshotProtection(onCapture?: () => void) {
  const callbackRef = useRef(onCapture);
  callbackRef.current = onCapture;

  useEffect(() => {
    if (Platform.OS === "android") {
      ScreenCapture.preventScreenCaptureAsync();
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
      };
    }

    if (Platform.OS === "ios") {
      const listener = ScreenCapture.addScreenshotListener(() => {
        callbackRef.current?.();
      });
      return () => {
        listener.remove();
      };
    }
  }, []);
}
