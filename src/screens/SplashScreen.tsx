import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";

export default function SplashScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#FF7326" />
      <LottieView
        source={require("../../assets/splash/hamddu-splash.json")}
        autoPlay
        loop={false}
        resizeMode="contain"
        style={styles.animation}
      />
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
  animation: { width: "39%", aspectRatio: 1 },
});
