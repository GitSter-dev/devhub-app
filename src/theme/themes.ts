import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from "expo-router";

import { darkColors, lightColors, type ThemeColors } from "./colors";
import { layout } from "./layout";
import { motion } from "./motion";
import { componentRadius, radius } from "./radius";
import { darkShadows, lightShadows, type ThemeShadows } from "./shadows";
import { layoutSpacing, spacing } from "./spacing";
import { fontFamily, type } from "./typography";

export type ColorScheme = "light" | "dark";

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  shadows: ThemeShadows;
  spacing: typeof spacing;
  layoutSpacing: typeof layoutSpacing;
  radius: typeof radius;
  componentRadius: typeof componentRadius;
  type: typeof type;
  motion: typeof motion;
  layout: typeof layout;
};

/** Everything that doesn't change with the color scheme. */
const invariant = {
  spacing,
  layoutSpacing,
  radius,
  componentRadius,
  type,
  motion,
  layout,
} as const;

export const themes: Record<ColorScheme, Theme> = {
  dark: { scheme: "dark", colors: darkColors, shadows: darkShadows, ...invariant },
  light: { scheme: "light", colors: lightColors, shadows: lightShadows, ...invariant },
};

/**
 * React Navigation's `Theme`, so native headers, tab bars and screen backgrounds
 * are painted from our tokens instead of its defaults. Feed this to expo-router's
 * `ThemeProvider`.
 *
 * Navigation's `fonts` entry still wants a `fontWeight` alongside `fontFamily` —
 * that's its type, not a contradiction of the ramp's fontFamily-only rule; the
 * weights here match the family each one names.
 */
export function navigationTheme(scheme: ColorScheme): NavigationTheme {
  const { colors } = themes[scheme];
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: scheme === "dark",
    colors: {
      primary: colors.accent,
      background: colors.backgroundCanvas,
      card: colors.headerBackground,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.dangerSolid,
    },
    fonts: {
      regular: { fontFamily: fontFamily.regular, fontWeight: "400" },
      medium: { fontFamily: fontFamily.medium, fontWeight: "500" },
      bold: { fontFamily: fontFamily.semibold, fontWeight: "600" },
      heavy: { fontFamily: fontFamily.bold, fontWeight: "700" },
    },
  };
}
