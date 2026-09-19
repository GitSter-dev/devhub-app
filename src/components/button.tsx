import { ActivityIndicator, StyleSheet, View } from "react-native";

import { componentRadius, continuous, minTouchTarget, opacity, spacing, useTheme } from "@/theme";

import { AppText } from "./app-text";
import { Icon, type IconName } from "./icon";
import { PressableScale } from "./pressable-scale";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = "primary", loading = false, disabled = false, icon, accessibilityHint }: ButtonProps) {
  const { colors, shadows } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { background: colors.accentSolid, border: colors.accentSolid, label: colors.onAccentSolid, shadow: shadows.accent },
    secondary: { background: colors.backgroundSurface, border: colors.borderStrong, label: colors.textPrimary, shadow: shadows.none },
    ghost: { background: "transparent", border: "transparent", label: colors.accent, shadow: shadows.none },
  }[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.button,
        continuous,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          boxShadow: inactive ? shadows.none : palette.shadow,
          opacity: disabled && !loading ? opacity.disabled : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.label} />
        ) : (
          <>
            <AppText variant="subhead" style={{ color: palette.label }}>
              {label}
            </AppText>
            {icon && <Icon name={icon} color={palette.label} size="sm" />}
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouchTarget + spacing.xs,
    borderRadius: componentRadius.button,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
