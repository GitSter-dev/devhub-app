import { StyleSheet, View } from "react-native";

import type { ActivityNotification, NotificationType } from "@/api/notifications-api";
import { AppText } from "@/components/app-text";
import { Icon, type IconName } from "@/components/icon";
import { PressableScale } from "@/components/pressable-scale";
import { relativeTime } from "@/features/posts/relative-time";
import { avatarSize, componentRadius, continuous, minTouchTarget, spacing, useThemeColors } from "@/theme";

import { notificationAction, notificationPreview, notificationWho } from "./notification-text";

const TYPE_ICONS: Record<NotificationType, IconName> = {
  POST_LIKED: "liked",
  POST_REPLIED: "reply",
  NEW_FOLLOWER: "personAdd",
  FOLLOWED_POSTED: "compose",
  MESSAGE_REQUEST: "chat",
};

const AVATAR = avatarSize.sm;
const AVATAR_OVERLAP = AVATAR / 3;
const MAX_AVATARS = 3;
const BADGE = 22;

type NotificationRowProps = {
  notification: ActivityNotification;
  fresh: boolean;
  onPress: () => void;
};

export function NotificationRow({ notification, fresh, onPress }: NotificationRowProps) {
  const colors = useThemeColors();
  const who = notificationWho(notification);
  const action = notificationAction(notification);
  const preview = notificationPreview(notification);
  const avatars = notification.actors.slice(0, MAX_AVATARS);

  return (
    <PressableScale
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={`${who} ${action}${preview ? `: ${preview}` : ""}`}
      onPress={onPress}
      style={[styles.row, continuous, fresh && { backgroundColor: colors.backgroundAccentSubtle }]}
    >
      <View style={styles.leading}>
        <View style={[styles.stack, { width: AVATAR + (avatars.length - 1) * (AVATAR - AVATAR_OVERLAP) }]}>
          {avatars.map((actor, index) => (
            <View
              key={actor.id}
              style={[
                styles.avatar,
                {
                  left: index * (AVATAR - AVATAR_OVERLAP),
                  zIndex: avatars.length - index,
                  backgroundColor: colors.backgroundSurface,
                  borderColor: colors.backgroundCanvas,
                },
              ]}
            >
              <AppText variant="subhead" tone="accent">
                {actor.displayName.charAt(0).toUpperCase()}
              </AppText>
            </View>
          ))}
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.accentSolid, borderColor: colors.backgroundCanvas }]}>
          <Icon name={TYPE_ICONS[notification.type]} color={colors.onAccentSolid} size="xs" />
        </View>
      </View>
      <View style={styles.text}>
        <AppText variant="body">
          <AppText variant="bodyStrong">{who}</AppText> {action}
          <AppText variant="body" tone="tertiary">
            {"  "}
            {relativeTime(notification.updatedAt)}
          </AppText>
        </AppText>
        {preview && (
          <AppText variant="footnote" tone="secondary" numberOfLines={2}>
            {preview}
          </AppText>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    minHeight: minTouchTarget + spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: componentRadius.card,
  },
  leading: {
    width: AVATAR + (MAX_AVATARS - 1) * (AVATAR - AVATAR_OVERLAP),
    height: AVATAR + spacing.xs,
  },
  stack: {
    height: AVATAR,
  },
  avatar: {
    position: "absolute",
    top: 0,
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    position: "absolute",
    left: AVATAR - BADGE / 2 - spacing.xxs,
    top: AVATAR - BADGE / 2 - spacing.xxs,
    zIndex: MAX_AVATARS + 1,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
