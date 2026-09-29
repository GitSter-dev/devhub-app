import { Text } from "react-native";

import { fontFamily, maxFontScale, useThemeColors } from "@/theme";

const sizes = { md: 20, lg: 30 } as const;

export function Wordmark({ size = "md" }: { size?: keyof typeof sizes }) {
  const colors = useThemeColors();
  const fontSize = sizes[size];

  return (
    <Text
      maxFontSizeMultiplier={maxFontScale}
      accessibilityRole="header"
      accessibilityLabel="DevHub"
      style={{ fontFamily: fontFamily.monoMedium, fontSize, lineHeight: fontSize * 1.25, letterSpacing: -0.5 }}
    >
      <Text style={{ color: colors.textTertiary }}>&lt;</Text>
      <Text style={{ color: colors.textPrimary }}>dev</Text>
      <Text style={{ color: colors.accent }}>/</Text>
      <Text style={{ color: colors.textPrimary }}>hub</Text>
      <Text style={{ color: colors.textTertiary }}>&gt;</Text>
    </Text>
  );
}
