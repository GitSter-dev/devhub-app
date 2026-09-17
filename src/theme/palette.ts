/**
 * Raw color ramps. Private to the theme — nothing outside `src/theme/` imports this.
 * Semantic roles live in `colors.ts`; screens and components only ever see those.
 */

/** Brand hue. 400/500 carry the dark theme, 700 the light theme. */
export const emerald = {
  50: "#ECFDF5",
  100: "#D1FAE5",
  200: "#A7F3D0",
  300: "#6EE7B7",
  400: "#34D399",
  500: "#10B981",
  600: "#059669",
  700: "#047857",
  800: "#065F46",
  900: "#064E3B",
  950: "#022C22",
} as const;

/**
 * Cool neutral with a faint green-cyan cast so it sits with emerald rather than
 * fighting it. The dark end is deliberately below Tailwind slate, tuned for OLED.
 */
export const ink = {
  0: "#FFFFFF",
  50: "#F4F7FA",
  100: "#EDF1F5",
  150: "#E7ECF1",
  200: "#DCE3EA",
  300: "#C3CDD6",
  400: "#93A1AE",
  450: "#7D8A99",
  500: "#5E6D79",
  600: "#4A5966",
  700: "#33404F",
  750: "#232D3A",
  800: "#18202A",
  850: "#121820",
  900: "#0B0F14",
  950: "#070A0E",
} as const;

/**
 * Status and topic hues as `[light, dark]` pairs — the light value is darkened to
 * clear 4.5:1 on a near-white ground, the dark value lightened to clear it on ink.
 */
export const hue = {
  // Light red is 700, not 600: #DC2626 measures 4.49:1 on the light canvas —
  // under AA by a hair. It survives as a *fill* (see `fixed.danger`), not as text.
  red: ["#B91C1C", "#F87171"],
  amber: ["#B45309", "#FBBF24"],
  green: ["#15803D", "#4ADE80"],
  sky: ["#0369A1", "#38BDF8"],
  cyan: ["#0E7490", "#22D3EE"],
  violet: ["#6D28D9", "#A78BFA"],
  rose: ["#BE123C", "#FB7185"],
  blue: ["#1D4ED8", "#60A5FA"],
} as const;

/**
 * Solid fills that hold up in both schemes: each clears 4.5:1 under a white
 * label and 3:1 against either canvas, so one value serves both.
 */
export const fixed = {
  danger: "#DC2626",
  success: "#15803D",
  info: "#0369A1",
} as const;

/**
 * Amber is the exception — it can't be one value. #D97706 reads well on dark but
 * falls to 2.96:1 against the light canvas, under the 3:1 floor for a UI
 * component, so the light scheme drops to amber 700. `[light, dark]`.
 */
export const warningFill = ["#B45309", "#D97706"] as const;
