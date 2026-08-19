import React from "react";
import { StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import SplashYarn from "../../assets/splash/yarn.svg";

export default function SplashScreen() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / 451, height / 980);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#FF7326" />
      <View style={[styles.logo, { transform: [{ translateY: -10 * scale }] }]}>
        <SplashYarn width={136 * scale} height={88 * scale} />
      </View>
      <Text style={[styles.tagline, { bottom: 98 * scale, fontSize: 16 * scale }]}>
        다함께 뜨는 뜨개질 플랫폼
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7326",
  },
  logo: { alignItems: "center", justifyContent: "center" },
  tagline: {
    position: "absolute",
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    letterSpacing: -0.48,
    textAlign: "center",
  },
});
