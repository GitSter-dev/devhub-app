import { StyleSheet } from "react-native";

/** One scale, so overlays never fight. Nothing outside this list sets a zIndex. */
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 20,
  header: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
} as const;

export const opacity = {
  pressed: 0.7,
  disabled: 0.4,
} as const;

/**
 * Touch targets. 44 is the floor for anything tappable; `hitSlop` extends a small
 * icon's tappable area without growing its layout box.
 */
export const minTouchTarget = 44;
export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Adjacent touch targets need at least 8px between them. */
export const minTouchGap = 8;

export const avatarSize = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 88,
} as const;

export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const borderWidth = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 2,
} as const;

/** Feed column cap — the app also builds to static web, where full-width text is unreadable. */
export const maxContentWidth = 680;

export const breakpoint = {
  sm: 480,
  md: 768,
  lg: 1024,
} as const;

export const layout = {
  zIndex,
  opacity,
  minTouchTarget,
  hitSlop,
  minTouchGap,
  avatarSize,
  iconSize,
  borderWidth,
  maxContentWidth,
  breakpoint,
} as const;

export type AvatarSizeToken = keyof typeof avatarSize;
export type IconSizeToken = keyof typeof iconSize;
