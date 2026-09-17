import { Easing } from "react-native-reanimated";

/**
 * Shared durations, easings and springs, so motion across the app feels related.
 *
 * Reanimated caveat: don't feed theme colors into Reanimated styles — use static
 * values there.
 */
export const duration = {
  instant: 0,
  /** State feedback: press, toggle, ripple. */
  fast: 120,
  /** Element transitions: enter, exit, reorder. */
  base: 200,
  /** Emphasized moves the eye should follow. */
  emphasized: 320,
  /** Large surfaces: sheets, screen transitions. */
  slow: 480,
} as const;

export const easing = {
  /** Material-style emphasized decelerate. The default for UI motion. */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Entering elements decelerate into place. */
  enter: Easing.out(Easing.cubic),
  /** Exiting elements accelerate away. */
  exit: Easing.in(Easing.cubic),
  linear: Easing.linear,
} as const;

export const spring = {
  /** Sheets, cards, anything large. */
  gentle: { damping: 20, stiffness: 180, mass: 1 },
  /** Buttons, chips, toggles — settles fast, no visible overshoot. */
  snappy: { damping: 24, stiffness: 340, mass: 0.9 },
  /** Celebratory only: the like button, a new-post badge. */
  bouncy: { damping: 13, stiffness: 240, mass: 1 },
} as const;

/** Press feedback, so every tappable surface reacts the same way. */
export const press = {
  scale: 0.97,
  opacity: 0.7,
} as const;

export const motion = { duration, easing, spring, press } as const;

export type DurationToken = keyof typeof duration;
export type SpringToken = keyof typeof spring;
