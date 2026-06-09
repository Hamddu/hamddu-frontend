import { useEffect } from "react";
import { Platform, NativeModules } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

export function useScreenshotProtection() {
  useEffect(() => {
    if (Platform.OS === "android") {
      ScreenCapture.preventScreenCaptureAsync();
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
      };
    }

    if (Platform.OS === "ios") {
      NativeModules.ScreenshotProtect?.enable();
      return () => {
        NativeModules.ScreenshotProtect?.disable();
      };
    }
  }, []);
}
