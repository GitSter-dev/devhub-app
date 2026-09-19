import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { PressableScale } from "@/components/pressable-scale";
import { avatarSize, componentRadius, continuous, layoutSpacing, minTouchTarget, spacing, useTheme } from "@/theme";

export type PersonIdentity = {
  id: string;
  username: string;
  displayName: string;
};

type PersonRowProps = {
  person: PersonIdentity;
  subtitle?: string;
  following: boolean;
  onToggleFollow: () => void;
  onOpen: () => void;
  canFollow?: boolean;
};

export function PersonRow({ person, subtitle, following, onToggleFollow, onOpen, canFollow = true }: PersonRowProps) {
  const { colors } = useTheme();

  return (
    <PressableScale
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={`${person.displayName}, @${person.username}`}
      accessibilityHint="Opens their profile"
      onPress={onOpen}
      style={[styles.row, continuous, { backgroundColor: colors.backgroundSurface, borderColor: colors.border }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
        <AppText variant="headline" tone="accent">
          {person.displayName.charAt(0).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.identity}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {person.displayName}
        </AppText>
        <AppText variant="handle" tone="tertiary" numberOfLines={1}>
          @{person.username}
        </AppText>
        {subtitle && (
          <AppText variant="footnote" tone="secondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {canFollow && <FollowButton following={following} name={person.displayName} onPress={onToggleFollow} />}
    </PressableScale>
  );
}

type FollowButtonProps = {
  following: boolean;
  name: string;
  onPress: () => void;
  wide?: boolean;
};

export function FollowButton({ following, name, onPress, wide = false }: FollowButtonProps) {
  const { colors } = useTheme();

  return (
    <PressableScale
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={following ? `Unfollow ${name}` : `Follow ${name}`}
      accessibilityState={{ selected: following }}
      onPress={onPress}
      style={[
        styles.follow,
        wide && styles.wide,
        following
          ? { backgroundColor: colors.backgroundSurface, borderColor: colors.borderStrong }
          : { backgroundColor: colors.accentSolid, borderColor: colors.accentSolid },
      ]}
    >
      <AppText variant="subhead" style={{ color: following ? colors.textPrimary : colors.onAccentSolid }}>
        {following ? "Following" : "Follow"}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
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
    gap: spacing.xxs,
  },
  follow: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget * 2,
    paddingHorizontal: spacing.md,
    borderRadius: componentRadius.chip,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wide: {
    alignSelf: "stretch",
  },
});
