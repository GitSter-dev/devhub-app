import { StyleSheet, View } from "react-native";
import Animated, { cubicBezier } from "react-native-reanimated";

import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { avatarSize, componentRadius, continuous, layoutSpacing, radius, spacing, useMotion, useTheme, type TopicColor } from "@/theme";

const WEEKS = 16;
const DAYS = 7;
const LEVELS = [0.12, 0.3, 0.55, 0.8, 1] as const;
const RISE = { from: { opacity: 0, transform: [{ translateY: 6 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } };
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const STACK: { name: string; color: TopicColor }[] = [
  { name: "rust", color: "amber" },
  { name: "typescript", color: "cyan" },
  { name: "compilers", color: "violet" },
];

function level(week: number, day: number): number {
  const noise = Math.sin(week * 12.9898 + day * 78.233) * 43758.5453;
  return LEVELS[Math.floor((noise - Math.floor(noise)) * LEVELS.length)];
}

export function IdentitySlide({ active }: { active: boolean }) {
  const { colors, shadows } = useTheme();
  const { reduced } = useMotion();

  return (
    <View
      style={[
        styles.card,
        continuous,
        { backgroundColor: colors.backgroundSurface, borderColor: colors.border, boxShadow: shadows.md },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
          <AppText variant="title2" tone="accent">
            A
          </AppText>
        </View>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <AppText variant="headline">Ada Lovelace</AppText>
            <Icon name="verified" color={colors.accent} size="sm" />
          </View>
          <AppText variant="handle" tone="tertiary">
            @ada_dev
          </AppText>
        </View>
      </View>

      <AppText variant="callout" tone="secondary">
        Compilers, coffee and clean commits.
      </AppText>

      <View style={styles.stack}>
        {STACK.map(({ name, color }) => (
          <View key={name} style={[styles.tag, { backgroundColor: colors.topic[color].bg }]}>
            <AppText variant="caption" style={{ color: colors.topic[color].fg }}>
              #{name}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.stats}>
        {[
          ["128", "posts"],
          ["2.4k", "followers"],
          ["312", "following"],
        ].map(([value, label]) => (
          <View key={label}>
            <AppText variant="bodyStrong">{value}</AppText>
            <AppText variant="caption" tone="tertiary">
              {label}
            </AppText>
          </View>
        ))}
      </View>

      <View key={active ? "active" : "idle"} style={styles.grid} accessibilityLabel="Contribution activity">
        {Array.from({ length: WEEKS }, (_, week) => (
          <Animated.View
            key={week}
            style={[
              styles.column,
              active && !reduced
                ? {
                    animationName: RISE,
                    animationDuration: "320ms",
                    animationDelay: `${week * 35}ms`,
                    animationFillMode: "backwards",
                    animationTimingFunction: EASE_OUT,
                  }
                : { opacity: active || reduced ? 1 : 0 },
            ]}
          >
            {Array.from({ length: DAYS }, (_, day) => (
              <View key={day} style={[styles.cell, { backgroundColor: colors.accentSolid, opacity: level(week, day) }]} />
            ))}
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: avatarSize.lg,
    height: avatarSize.lg,
    borderRadius: componentRadius.avatar,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stack: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: componentRadius.chip,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  grid: {
    flexDirection: "row",
    gap: 3,
  },
  column: {
    flex: 1,
    gap: 3,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: radius.xs / 2,
  },
});
