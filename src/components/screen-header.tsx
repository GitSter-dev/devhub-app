import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { hitSlop, minTouchTarget, spacing, useThemeColors } from "@/theme";

import { AppText } from "./app-text";
import { Icon } from "./icon";

type ScreenHeaderProps = {
  title?: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={hitSlop}
        onPress={() => router.back()}
        style={[styles.back, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
      >
        <Icon name="back" color={colors.textPrimary} />
      </Pressable>
      <AppText variant="headline" numberOfLines={1} style={styles.title} accessibilityRole="header">
        {title ?? ""}
      </AppText>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
  },
  side: {
    minWidth: minTouchTarget,
    alignItems: "flex-end",
  },
});
