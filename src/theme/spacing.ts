/** 4-point spacing scale. Steps are named by size, never by use. */
export const spacing = {
  none: 0,
  hair: 1,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  giant: 64,
} as const;

export type SpacingToken = keyof typeof spacing;

/**
 * Fixed layout rhythms. These are aliases, not new values — if a layout needs
 * something between steps, use the nearest step. The grid is the point.
 */
export const layoutSpacing = {
  /** Horizontal inset on every screen. Pick one and keep it. */
  screenX: spacing.base,
  /** Inner padding of a card or post row. */
  cardPadding: spacing.base,
  /** Gap between sibling rows in a feed. */
  listGap: spacing.md,
  /** Gap between major sections of a screen. */
  sectionGap: spacing.xl,
} as const;
