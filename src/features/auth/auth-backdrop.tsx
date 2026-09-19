import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { useTheme } from "@/theme";

const CODE_LINES = [
  "const dev = await hub.connect();",
  "git commit -m \"ship it\"",
  "fn main() { println!(\"hi\"); }",
  "npx expo start --android",
  "SELECT * FROM builders;",
  "docker compose up -d",
];

export function AuthBackdrop() {
  const { colors, shadows } = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.glow,
          { backgroundColor: colors.backgroundAccentSubtle, boxShadow: shadows.accent },
        ]}
      />
      <View style={styles.code}>
        {CODE_LINES.map((line) => (
          <AppText key={line} variant="code" tone="tertiary" numberOfLines={1} style={styles.line}>
            {line}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    top: -140,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.9,
  },
  code: {
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
    gap: 6,
    opacity: 0.08,
  },
  line: {
    transform: [{ rotate: "-4deg" }],
  },
});
