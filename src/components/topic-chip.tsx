import { StyleSheet } from "react-native";

import { topicColor } from "@/features/topics/topic-color";
import { componentRadius, minTouchTarget, opacity, spacing, useThemeColors } from "@/theme";

import { AppText } from "./app-text";
import { PressableScale } from "./pressable-scale";

type TopicChipProps = {
  slug: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function TopicChip({ slug, selected, onPress, disabled = false }: TopicChipProps) {
  const colors = useThemeColors();
  const swatch = colors.topic[topicColor(slug)];

  return (
    <PressableScale
      haptic={false}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={slug}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? swatch.bg : colors.backgroundSunken,
          borderColor: selected ? swatch.fg : colors.border,
          opacity: disabled ? opacity.disabled : 1,
        },
      ]}
    >
      <AppText variant="subhead" style={{ color: selected ? swatch.fg : colors.textSecondary }}>
        #{slug}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouchTarget - spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: componentRadius.chip,
    borderWidth: 1,
    justifyContent: "center",
  },
});
