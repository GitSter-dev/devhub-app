/**
 * The single entry point for design tokens: `import { spacing, type } from "@/theme"`.
 *
 * Nothing outside this folder imports past it — `palette.ts` in particular is
 * private, so raw ramp values can never leak into a screen.
 *
 * Static-safe vs hook-only:
 *   - spacing, radius, typography, motion and layout never change with the color
 *     scheme, so they can be imported at module scope (inside `StyleSheet.create`).
 *   - colors and shadows DO change, so they come from `useTheme()`/`useThemeColors()`
 *     at render time. Don't bake them into a module-scope StyleSheet.
 */

export { darkColors, lightColors, type ThemeColors, type TopicColor } from "./colors";
export { layout, zIndex, opacity, minTouchTarget, hitSlop, minTouchGap, avatarSize, iconSize, borderWidth, maxContentWidth, breakpoint, type AvatarSizeToken, type IconSizeToken } from "./layout";
export { motion, duration, easing, spring, press, type DurationToken, type SpringToken } from "./motion";
export { radius, continuous, componentRadius, type RadiusToken } from "./radius";
export { darkShadows, lightShadows, type ShadowToken, type ThemeShadows } from "./shadows";
export { spacing, layoutSpacing, type SpacingToken } from "./spacing";
export { ThemeProvider, type ThemePreference, type ThemeContextValue } from "./theme-provider";
export { themes, navigationTheme, type ColorScheme, type Theme } from "./themes";
export { fontFamily, type, type TypeToken } from "./typography";
export { useTheme, useThemeColors, useColorScheme, useThemePreference, useMotion, type MotionTokens } from "./use-theme";
