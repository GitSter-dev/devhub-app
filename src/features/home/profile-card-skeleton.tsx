import { StyleSheet, View } from "react-native";

import { avatarSize, componentRadius, continuous, layoutSpacing, radius, spacing, useThemeColors } from "@/theme";

export function ProfileCardSkeleton() {
  const colors = useThemeColors();

  return (
    <View
      accessibilityLabel="Loading your profile"
      style={[styles.card, continuous, { backgroundColor: colors.backgroundSurface, borderColor: colors.border }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.skeleton }]} />
      <View style={[styles.line, { width: 160, backgroundColor: colors.skeleton }]} />
      <View style={[styles.line, { width: 96, backgroundColor: colors.skeletonHighlight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: layoutSpacing.cardPadding + spacing.xs,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: avatarSize.xl,
    height: avatarSize.xl,
    borderRadius: componentRadius.avatar,
  },
  line: {
    height: 14,
    borderRadius: radius.xs,
  },
});
