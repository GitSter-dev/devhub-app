import * as SystemUI from "expo-system-ui";
import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { Appearance, useColorScheme as useSystemColorScheme } from "react-native";

import { readStoredPreference, writeStoredPreference } from "./preference-storage";
import { themes, type ColorScheme, type Theme } from "./themes";

export type ThemePreference = "system" | "light" | "dark";

/** Dark is authored first and is what a new install opens in. */
const DEFAULT_PREFERENCE: ThemePreference = "dark";

export type ThemeContextValue = {
  /** What the user asked for. */
  preference: ThemePreference;
  /** What that resolves to right now — never "system". */
  scheme: ColorScheme;
  theme: Theme;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function isPreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

/** Synchronous, so the very first frame is already in the right scheme. */
function readPreference(): ThemePreference {
  const stored = readStoredPreference();
  return isPreference(stored) ? stored : DEFAULT_PREFERENCE;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);

  // "system" defers to the OS; anything else wins. RN reports "unspecified"
  // (and briefly null) before the OS scheme is known — both fall to dark, which
  // is this app's default anyway, so there's no flash on the way in.
  const scheme: ColorScheme =
    preference === "system" ? (systemScheme === "light" ? "light" : "dark") : preference;

  // Push the choice down to native, so headers, sheets, the keyboard and the
  // scroll-bounce all follow it too — not just our own views.
  //
  // react-native-web has no `setColorScheme`, and calling it there throws and
  // takes the whole app down, so this is feature-detected rather than assumed.
  // On web the browser owns its own chrome anyway; our views still re-render.
  useEffect(() => {
    if (typeof Appearance.setColorScheme !== "function") return;
    Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
  }, [preference]);

  // Paints the window behind React, which is what you see during a cold start
  // and past the end of an over-scroll. Without it, Android flashes white.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(themes[scheme].colors.backgroundCanvas).catch(() => {
      // Not supported on every platform; purely cosmetic if it fails.
    });
  }, [scheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeStoredPreference(next);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ preference, scheme, theme: themes[scheme], setPreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
