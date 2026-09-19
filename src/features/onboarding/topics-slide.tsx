import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { PressableScale } from "@/components/pressable-scale";
import { haptics } from "@/feedback/haptics";
import { componentRadius, minTouchTarget, spacing, useThemeColors, type TopicColor } from "@/theme";

const TOPICS: { name: string; color: TopicColor }[] = [
  { name: "react-native", color: "emerald" },
  { name: "typescript", color: "cyan" },
  { name: "ai", color: "violet" },
  { name: "rust", color: "amber" },
  { name: "design", color: "rose" },
  { name: "devops", color: "blue" },
  { name: "kotlin", color: "violet" },
  { name: "open-source", color: "emerald" },
  { name: "databases", color: "cyan" },
  { name: "go", color: "blue" },
  { name: "security", color: "rose" },
  { name: "game-dev", color: "amber" },
];

export function TopicsSlide() {
  const colors = useThemeColors();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(["react-native", "rust"]));

  const toggle = (name: string) => {
    haptics.selection();
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {TOPICS.map(({ name, color }) => {
          const on = selected.has(name);
          const swatch = colors.topic[color];
          return (
            <PressableScale
              key={name}
              haptic={false}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={name}
              onPress={() => toggle(name)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? swatch.bg : colors.backgroundSunken,
                  borderColor: on ? swatch.fg : colors.border,
                },
              ]}
            >
              <AppText variant="subhead" style={{ color: on ? swatch.fg : colors.textSecondary }}>
                #{name}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
      <AppText variant="metric" tone="accent" center>
        {selected.size} {selected.size === 1 ? "topic" : "topics"} selected · tap to try it
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  chip: {
    minHeight: minTouchTarget - spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: componentRadius.chip,
    borderWidth: 1,
    justifyContent: "center",
  },
});
