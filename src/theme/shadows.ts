/**
 * Elevation as `boxShadow` strings (RN 0.76+), never the legacy
 * `shadowColor`/`shadowOffset`/`elevation` props.
 *
 * Shadows are per-scheme because a black shadow barely reads on a dark canvas.
 * On dark, elevation is really carried by `backgroundElevated` plus a `border`
 * hairline; the shadow only reinforces it.
 */
export const darkShadows = {
  none: "none",
  sm: "0px 1px 2px rgba(0, 0, 0, 0.50)",
  md: "0px 6px 18px rgba(0, 0, 0, 0.55)",
  lg: "0px 16px 40px rgba(0, 0, 0, 0.65)",
  /** Lift under a primary CTA — an emerald glow rather than a shadow. */
  accent: "0px 6px 24px rgba(16, 185, 129, 0.30)",
} as const;

export type ThemeShadows = { [K in keyof typeof darkShadows]: string };

export const lightShadows: ThemeShadows = {
  none: "none",
  sm: "0px 1px 2px rgba(12, 19, 24, 0.06)",
  md: "0px 4px 12px rgba(12, 19, 24, 0.10)",
  lg: "0px 12px 32px rgba(12, 19, 24, 0.14)",
  accent: "0px 6px 20px rgba(4, 120, 87, 0.28)",
};

export type ShadowToken = keyof typeof darkShadows;
