import { StyleSheet, View } from "react-native";

import type { Suggestion } from "@/api/suggestions-api";
import { AppText } from "@/components/app-text";
import { PressableScale } from "@/components/pressable-scale";
import { avatarSize, componentRadius, continuous, layoutSpacing, minTouchTarget, spacing, useTheme } from "@/theme";

const MAX_REASON_TOPICS = 3;

type SuggestionRowProps = {
  suggestion: Suggestion;
  following: boolean;
  onToggle: () => void;
};

function reasonOf({ reason }: Suggestion): string {
  if (reason.type === "SHARED_TOPICS" && reason.topics.length > 0) {
    return `Also into ${reason.topics.slice(0, MAX_REASON_TOPICS).map((topic) => `#${topic}`).join(", ")}`;
  }
  return "Suggested for you";
}

export function SuggestionRow({ suggestion, following, onToggle }: SuggestionRowProps) {
  const { colors } = useTheme();
  const { user } = suggestion;

  return (
    <View style={[styles.row, continuous, { backgroundColor: colors.backgroundSurface, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
        <AppText variant="headline" tone="accent">
          {user.displayName.charAt(0).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.identity}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {user.displayName}
        </AppText>
        <AppText variant="handle" tone="tertiary" numberOfLines={1}>
          @{user.username}
        </AppText>
        <AppText variant="footnote" tone="secondary" numberOfLines={1}>
          {reasonOf(suggestion)}
        </AppText>
      </View>
      <PressableScale
        haptic={false}
        accessibilityRole="button"
        accessibilityLabel={following ? `Unfollow ${user.displayName}` : `Follow ${user.displayName}`}
        accessibilityState={{ selected: following }}
        onPress={onToggle}
        style={[
          styles.follow,
          following
            ? { backgroundColor: colors.backgroundSurface, borderColor: colors.borderStrong }
            : { backgroundColor: colors.accentSolid, borderColor: colors.accentSolid },
        ]}
      >
        <AppText variant="subhead" style={{ color: following ? colors.textPrimary : colors.onAccentSolid }}>
          {following ? "Following" : "Follow"}
        </AppText>
      </PressableScale>
    </View>
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
});
