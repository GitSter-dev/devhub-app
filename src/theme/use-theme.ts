import { useContext, useMemo } from "react";
import { useReducedMotion } from "react-native-reanimated";

import type { ThemeColors } from "./colors";
import {
  duration,
  easing,
  press,
  spring,
  type DurationToken,
  type SpringToken,
} from "./motion";
import { ThemeContext, type ThemePreference } from "./theme-provider";
import type { ColorScheme, Theme } from "./themes";

function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider> (see src/app/_layout.tsx)");
  }
  return context;
}

/** The whole active theme: colors, shadows, and every invariant token group. */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** The common case — just the colors. */
export function useThemeColors(): ThemeColors {
  return useThemeContext().theme.colors;
}

/** The resolved scheme. Never "system". */
export function useColorScheme(): ColorScheme {
  return useThemeContext().scheme;
}

/** For an appearance setting screen: the raw preference and its setter. */
export function useThemePreference(): {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
} {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
}

export type SpringConfig = { damping: number; stiffness: number; mass: number };

export type MotionTokens = {
  duration: Record<DurationToken, number>;
  easing: typeof easing;
  spring: Record<SpringToken, SpringConfig>;
  press: { scale: number; opacity: number };
  /** True when the OS has Reduce Motion on, in case a call site needs to branch. */
  reduced: boolean;
};

/** Heavily overdamped and very stiff: lands on the target with no visible travel. */
const STILL_SPRING: SpringConfig = { damping: 100, stiffness: 1000, mass: 0.1 };

/**
 * Motion tokens with Reduce Motion already applied: durations collapse to 0 and
 * springs stop travelling, so animations resolve instantly. Use this instead of
 * importing `motion` directly in components — that way honoring the setting
 * isn't something each call site has to remember.
 *
 * Opacity is left alone: cross-fades are the one transition Reduce Motion is
 * fine with, and it's what the setting asks you to substitute.
 */
export function useMotion(): MotionTokens {
  const reduced = useReducedMotion();

  return useMemo<MotionTokens>(() => {
    if (!reduced) return { duration, easing, spring, press, reduced };

    const stillDurations = {} as Record<DurationToken, number>;
    for (const key of Object.keys(duration) as DurationToken[]) {
      stillDurations[key] = 0;
    }

    const stillSprings = {} as Record<SpringToken, SpringConfig>;
    for (const key of Object.keys(spring) as SpringToken[]) {
      stillSprings[key] = STILL_SPRING;
    }

    return {
      duration: stillDurations,
      easing,
      spring: stillSprings,
      press: { scale: 1, opacity: press.opacity },
      reduced,
    };
  }, [reduced]);
}
