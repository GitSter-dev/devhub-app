import { StyleSheet, View } from "react-native";

import { useCountdown } from "@/hooks/use-countdown";
import { componentRadius, continuous, spacing, useThemeColors } from "@/theme";

import { AppText } from "./app-text";
import { Icon, type IconName } from "./icon";

export type BannerTone = "error" | "info" | "success";

type FormBannerProps = {
  tone: BannerTone;
  message: string;
  retryAfterSeconds?: number | null;
};

const toneIcon: Record<BannerTone, IconName> = { error: "error", info: "info", success: "success" };

export function FormBanner({ tone, message, retryAfterSeconds = null }: FormBannerProps) {
  const colors = useThemeColors();
  const remaining = useCountdown(retryAfterSeconds, message);

  const palette = {
    error: { background: colors.backgroundDangerSubtle, foreground: colors.danger },
    info: { background: colors.backgroundInfoSubtle, foreground: colors.info },
    success: { background: colors.backgroundSuccessSubtle, foreground: colors.success },
  }[tone];

  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : "text"}
      accessibilityLiveRegion="polite"
      style={[styles.banner, continuous, { backgroundColor: palette.background }]}
    >
      <Icon name={toneIcon[tone]} color={palette.foreground} size="sm" />
      <View style={styles.text}>
        <AppText variant="footnote" style={{ color: palette.foreground }}>
          {message}
        </AppText>
        {remaining > 0 && (
          <AppText variant="metric" style={{ color: palette.foreground }}>
            Try again in {remaining}s
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: componentRadius.input,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
