import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { Icon, type IconName } from "@/components/icon";
import { hitSlop, minTouchTarget, spacing, useThemeColors } from "@/theme";

type BadgedIconButtonProps = {
  icon: IconName;
  label: string;
  count: number;
  onPress: () => void;
};

export function BadgedIconButton({ icon, label, count, onPress }: BadgedIconButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `${label}, ${count} new` : label}
      hitSlop={hitSlop}
      onPress={onPress}
      style={[styles.button, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
    >
      <Icon name={icon} color={colors.textSecondary} />
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.accentSolid, borderColor: colors.backgroundCanvas }]}>
          <AppText variant="caption" style={{ color: colors.onAccentSolid }}>
            {count > 99 ? "99+" : count}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -spacing.xxs,
    right: -spacing.xxs,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: spacing.xxs,
    alignItems: "center",
    justifyContent: "center",
  },
});
