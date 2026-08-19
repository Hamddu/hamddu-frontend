import { StyleSheet, Text, View } from "react-native";
import Hat from "../../assets/home/hat.svg";

export default function ChallengeImagePlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.container}>
      <View style={[styles.glow, !compact && styles.glowLarge]} />
      <View style={[styles.dotLeft, !compact && styles.dotLarge]} />
      <View style={styles.dotRight} />
      <Hat width={compact ? 60 : 112} height={compact ? 52 : 97} />
      <Text style={[styles.text, !compact && styles.textLarge]}>함뜨 기록</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7F1",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#FFE8D8",
    top: -28,
    right: -26,
  },
  glowLarge: {
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -72,
    right: -58,
  },
  dotLeft: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFD1B5",
    left: 16,
    top: 22,
  },
  dotLarge: {
    width: 13,
    height: 13,
    borderRadius: 7,
    left: 44,
    top: 88,
  },
  dotRight: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFB98F",
    right: 18,
    bottom: 28,
  },
  text: {
    marginTop: -2,
    fontSize: 11,
    fontWeight: "800",
    color: "#C7521A",
  },
  textLarge: {
    marginTop: 4,
    fontSize: 15,
  },
});
