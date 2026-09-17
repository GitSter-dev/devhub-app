/**
 * Corner radii. Every non-capsule radius is paired with `borderCurve: "continuous"`
 * so corners match the platform's squircle rather than a plain circular arc.
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  /** Capsules: pills, chips, avatars. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

/** Spread onto any view that uses a non-capsule radius. */
export const continuous = { borderCurve: "continuous" } as const;

/** Which radius each recurring surface uses. Reach for these before `radius` itself. */
export const componentRadius = {
  avatar: radius.full,
  chip: radius.full,
  button: radius.md,
  input: radius.md,
  card: radius.lg,
  image: radius.md,
  sheet: radius.xxl,
} as const;
