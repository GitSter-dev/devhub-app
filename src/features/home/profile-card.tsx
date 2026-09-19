import { StyleSheet, View } from "react-native";

import type { CurrentUser } from "@/api/users-api";
import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { avatarSize, componentRadius, continuous, layoutSpacing, spacing, useTheme } from "@/theme";

const joinedFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

export function ProfileCard({ user }: { user: CurrentUser }) {
  const { colors, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        continuous,
        { backgroundColor: colors.backgroundSurface, borderColor: colors.border, boxShadow: shadows.md },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
        <AppText variant="title1" tone="accent">
          {user.displayName.charAt(0).toUpperCase()}
        </AppText>
      </View>

      <View style={styles.identity}>
        <AppText variant="title2" numberOfLines={1}>
          {user.displayName}
        </AppText>
        <AppText variant="handle" tone="tertiary">
          @{user.username}
        </AppText>
      </View>

      <View style={styles.meta}>
        {user.emailVerified && (
          <View style={[styles.badge, { backgroundColor: colors.backgroundAccentSubtle }]}>
            <Icon name="verified" color={colors.accent} size="sm" />
            <AppText variant="caption" tone="accent">
              Verified
            </AppText>
          </View>
        )}
        <AppText variant="footnote" tone="tertiary">
          Joined {joinedFormat.format(new Date(user.createdAt))}
        </AppText>
      </View>
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    alignItems: "center",
    gap: spacing.xxs,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: componentRadius.chip,
  },
});
