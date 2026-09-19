import { Text, type TextProps } from "react-native";

import { type, useThemeColors, type ThemeColors, type TypeToken } from "@/theme";

export type TextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "accent"
  | "danger"
  | "success"
  | "warning"
  | "onAccent"
  | "link";

const toneRole: Record<TextTone, keyof Omit<ThemeColors, "topic">> = {
  primary: "textPrimary",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  accent: "accent",
  danger: "danger",
  success: "success",
  warning: "warning",
  onAccent: "onAccentSolid",
  link: "textLink",
};

type AppTextProps = TextProps & {
  variant?: TypeToken;
  tone?: TextTone;
  uppercase?: boolean;
  center?: boolean;
};

export function AppText({
  variant = "body",
  tone = "primary",
  uppercase = false,
  center = false,
  style,
  ...rest
}: AppTextProps) {
  const colors = useThemeColors();
  return (
    <Text
      {...rest}
      style={[
        type[variant],
        { color: colors[toneRole[tone]] },
        uppercase && { textTransform: "uppercase" },
        center && { textAlign: "center" },
        style,
      ]}
    />
  );
}
