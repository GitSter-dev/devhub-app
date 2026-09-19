import { StyleSheet, View } from "react-native";

import type { Conversation } from "@/api/chat-api";
import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/pressable-scale";
import { relativeTime } from "@/features/posts/relative-time";
import { avatarSize, componentRadius, minTouchTarget, spacing, useThemeColors } from "@/theme";

import { conversationTitle, messagePreview, tickFor } from "./conversation-display";
import { MessageTicks } from "./message-ticks";

type ConversationRowProps = {
  conversation: Conversation;
  myId: string | null;
  onPress: () => void;
};

export function ConversationRow({ conversation, myId, onPress }: ConversationRowProps) {
  const colors = useThemeColors();
  const title = conversationTitle(conversation, myId);
  const last = conversation.lastMessage;
  const mineLast = last?.kind === "TEXT" && last.sender?.id === myId && !last.deleted;
  const unread = conversation.unreadCount > 0;

  return (
    <PressableScale
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={`${title}${unread ? `, ${conversation.unreadCount} unread` : ""}`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
        {conversation.kind === "GROUP" ? (
          <Icon name="group" color={colors.accent} />
        ) : (
          <AppText variant="headline" tone="accent">
            {title.charAt(0).toUpperCase()}
          </AppText>
        )}
      </View>
      <View style={styles.text}>
        <View style={styles.line}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          <AppText variant="caption" tone={unread ? "accent" : "tertiary"}>
            {relativeTime(conversation.lastActivityAt)}
          </AppText>
        </View>
        <View style={styles.line}>
          {mineLast && last && <MessageTicks state={tickFor(last, conversation)} />}
          <AppText variant="footnote" tone={unread ? "primary" : "secondary"} numberOfLines={1} style={styles.title}>
            {messagePreview(last, myId)}
          </AppText>
          {unread && (
            <View style={[styles.badge, { backgroundColor: colors.accentSolid }]}>
              <AppText variant="caption" style={{ color: colors.onAccentSolid }}>
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: minTouchTarget + spacing.lg,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: avatarSize.lg,
    height: avatarSize.lg,
    borderRadius: componentRadius.avatar,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    flex: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
});
