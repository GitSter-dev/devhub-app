import { emerald, fixed, hue, ink, warningFill } from "./palette";

/**
 * Semantic color roles.
 *
 * Dark is authored first and is the app's default. `lightColors` is annotated
 * with `ThemeColors`, so a key missing from either scheme is a compile error.
 *
 * Every value comes from a ramp in `palette.ts` — no loose hex literals here.
 * Contrast ratios in the comments are measured (WCAG 2.1 relative luminance),
 * not estimated: text roles clear 4.5:1 against the surfaces they sit on, and
 * solid fills clear 3:1 against the canvas as UI components.
 */
export const darkColors = {
  // Surfaces
  backgroundCanvas: ink[900], // #0B0F14 — app ground
  backgroundSurface: ink[850], // #121820 — cards, post rows
  backgroundElevated: ink[800], // #18202A — sheets, menus
  backgroundSunken: ink[950], // #070A0E — inputs, code blocks
  backgroundInverse: ink[50],

  // Lines
  border: ink[750],
  borderStrong: ink[700],
  borderAccent: emerald[500],
  borderFocus: emerald[400],

  // Text
  textPrimary: ink[100], // #EDF1F5 — 17.0:1 on canvas
  textSecondary: ink[400], // #93A1AE — 6.8:1 on surface
  textTertiary: ink[450], // #7D8A99 — 5.5:1 on canvas; metadata only
  textDisabled: ink[600], // below AA by contract — never load-bearing
  textInverse: ink[900],

  // Brand
  accent: emerald[400], // #34D399 — 10.0:1 on canvas. Text, icons, indicators.
  accentSolid: emerald[500], // #10B981 — filled buttons, FAB, active tab pill
  accentPressed: emerald[600],
  onAccentSolid: emerald[950], // #022C22 on #10B981 — 6.0:1
  backgroundAccentSubtle: "rgba(52, 211, 153, 0.14)",
  borderAccentSubtle: "rgba(52, 211, 153, 0.28)",

  // Status — `x` tints text/icons, `xSolid` fills, `onXSolid` labels the fill
  danger: hue.red[1],
  dangerSolid: fixed.danger, // identical in both schemes: 4.8:1 with white, 4.0:1 on canvas
  onDangerSolid: ink[0],
  backgroundDangerSubtle: "rgba(248, 113, 113, 0.14)",

  warning: hue.amber[1],
  warningSolid: warningFill[1], // #D97706 — white only reaches 3.2:1 here, so the label is ink
  onWarningSolid: ink[900], // 6.0:1
  backgroundWarningSubtle: "rgba(251, 191, 36, 0.14)",

  success: hue.green[1], // a cooler green than the brand, so "build passed" != "branded"
  successSolid: fixed.success,
  onSuccessSolid: ink[0],
  backgroundSuccessSubtle: "rgba(74, 222, 128, 0.14)",

  info: hue.sky[1],
  infoSolid: fixed.info,
  onInfoSolid: ink[0],
  backgroundInfoSubtle: "rgba(56, 189, 248, 0.14)",

  // Chrome
  headerBackground: ink[900],
  tabBarBackground: ink[850],
  tabBarBorder: ink[750],

  // Content
  textLink: emerald[400],
  codeBackground: ink[950],
  codeBorder: ink[750],
  scrim: "rgba(0, 0, 0, 0.60)",
  skeleton: ink[800],
  skeletonHighlight: ink[750],

  /** Topic / language chips. `fg` on `bg`, both scheme-specific. */
  topic: {
    emerald: { fg: emerald[300], bg: "rgba(52, 211, 153, 0.14)" },
    cyan: { fg: hue.cyan[1], bg: "rgba(34, 211, 238, 0.14)" },
    violet: { fg: hue.violet[1], bg: "rgba(167, 139, 250, 0.16)" },
    amber: { fg: hue.amber[1], bg: "rgba(251, 191, 36, 0.14)" },
    rose: { fg: hue.rose[1], bg: "rgba(251, 113, 133, 0.14)" },
    blue: { fg: hue.blue[1], bg: "rgba(96, 165, 250, 0.16)" },
  },
} as const;

export type TopicColor = keyof typeof darkColors.topic;

/** Every role is a color string, except `topic`, which is a map of fg/bg pairs. */
export type ThemeColors = Omit<
  { [K in keyof typeof darkColors]: string },
  "topic"
> & {
  topic: Record<TopicColor, { fg: string; bg: string }>;
};

export const lightColors: ThemeColors = {
  // Surfaces
  backgroundCanvas: ink[50], // #F4F7FA
  backgroundSurface: ink[0], // #FFFFFF
  backgroundElevated: ink[0], // same tone as surface; separated by shadow, not by color
  backgroundSunken: ink[150], // #E7ECF1
  backgroundInverse: ink[900],

  // Lines
  border: ink[200],
  borderStrong: ink[300],
  borderAccent: emerald[700],
  borderFocus: emerald[700],

  // Text
  textPrimary: ink[900], // #0B0F14 — 19.3:1 on white
  textSecondary: ink[600], // #4A5966 — 7.2:1 on white
  textTertiary: ink[500], // #5E6D79 — 5.0:1 on canvas; metadata only
  textDisabled: ink[400],
  textInverse: ink[0],

  // Brand
  accent: emerald[700], // #047857 — 5.5:1 on white
  accentSolid: emerald[700], // emerald 600 under white text is only 3.8:1, so 700 it is
  accentPressed: emerald[800],
  onAccentSolid: ink[0], // 5.5:1
  backgroundAccentSubtle: "rgba(4, 120, 87, 0.10)",
  borderAccentSubtle: "rgba(4, 120, 87, 0.22)",

  // Status
  danger: hue.red[0],
  dangerSolid: fixed.danger,
  onDangerSolid: ink[0],
  backgroundDangerSubtle: "rgba(185, 28, 28, 0.10)",

  warning: hue.amber[0],
  warningSolid: warningFill[0], // amber 700 — 700 clears 3:1 on the light canvas, 600 does not
  onWarningSolid: ink[0], // 5.0:1
  backgroundWarningSubtle: "rgba(180, 83, 9, 0.12)",

  success: hue.green[0],
  successSolid: fixed.success,
  onSuccessSolid: ink[0],
  backgroundSuccessSubtle: "rgba(21, 128, 61, 0.10)",

  info: hue.sky[0],
  infoSolid: fixed.info,
  onInfoSolid: ink[0],
  backgroundInfoSubtle: "rgba(3, 105, 161, 0.10)",

  // Chrome
  headerBackground: ink[0],
  tabBarBackground: ink[0],
  tabBarBorder: ink[200],

  // Content
  textLink: emerald[700],
  codeBackground: ink[150],
  codeBorder: ink[200],
  scrim: "rgba(12, 19, 24, 0.40)",
  skeleton: ink[150],
  skeletonHighlight: ink[100],

  topic: {
    emerald: { fg: emerald[700], bg: "rgba(4, 120, 87, 0.10)" },
    cyan: { fg: hue.cyan[0], bg: "rgba(14, 116, 144, 0.10)" },
    violet: { fg: hue.violet[0], bg: "rgba(109, 40, 217, 0.10)" },
    amber: { fg: hue.amber[0], bg: "rgba(180, 83, 9, 0.12)" },
    rose: { fg: hue.rose[0], bg: "rgba(190, 18, 60, 0.10)" },
    blue: { fg: hue.blue[0], bg: "rgba(29, 78, 216, 0.10)" },
  },
};
