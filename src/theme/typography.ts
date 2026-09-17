import type { TextStyle } from "react-native";

/**
 * Inter for UI and prose, JetBrains Mono for the things that are literally code:
 * @handles, counts, and snippets.
 *
 * Weight is set through `fontFamily` only — never `fontWeight`. With bundled
 * static font files, iOS otherwise synthesizes the weight or drops to the system
 * face, and the ramp stops being trustworthy.
 */
export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

/**
 * Named text styles. Screens never touch `fontSize`; they pick a ramp step.
 *
 * Deliberately carries no `color`: color is scheme-dependent, and leaving it out
 * keeps this module *static-safe* — importable at module scope from anywhere,
 * including other token files. `ThemedText` applies the color at render time.
 */
export const type = {
  /** Onboarding headlines, empty states. */
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.6,
  },
  /** Screen titles outside a native stack header. */
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  /** Section headings. */
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.3,
  },
  /** Card titles. */
  title3: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.2,
  },
  /** Author names, list row heads. */
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.1,
  },
  /** Post text. 17/26 is a 1.53 line-height — inside the 1.5–1.75 reading band. */
  body: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: fontFamily.regular,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0,
  },
  /** Replies, secondary prose. */
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    letterSpacing: 0,
  },
  /** Button labels, tab labels. */
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamily.medium,
    letterSpacing: 0,
  },
  /** Timestamps. */
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.regular,
    letterSpacing: 0.1,
  },
  /** Counts, badge text. */
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.medium,
    letterSpacing: 0.2,
  },
  /** Uppercase section kickers. Pair with `textTransform: "uppercase"`. */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.8,
  },
  /** `@ada` — the mono face is the tell that it's an identifier, not a name. */
  handle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamily.mono,
    letterSpacing: 0,
  },
  /** Engagement counts: tabular-feeling, so numbers don't jitter as they change. */
  metric: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.monoMedium,
    letterSpacing: 0.2,
  },
  /** Inline and block snippets. */
  code: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamily.mono,
    letterSpacing: 0,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeToken = keyof typeof type;
