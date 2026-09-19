import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import type { ChatMessage } from "@/api/chat-api";
import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { haptics } from "@/feedback/haptics";
import { CodeBlock } from "@/features/posts/code-block";
import { componentRadius, layoutSpacing, spacing, useThemeColors } from "@/theme";

import type { TickState } from "./conversation-display";
import { MessageTicks } from "./message-ticks";

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const SWIPE_THRESHOLD = 64;

type BubbleContent = {
  body: string | null;
  code: string | null;
  codeLanguage: string | null;
  deleted: boolean;
  createdAt: string;
  replyTo: ChatMessage["replyTo"];
};

type MessageBubbleProps = {
  content: BubbleContent;
  mine: boolean;
  senderName: string | null;
  tick: TickState | null;
  onReply?: () => void;
  onLongPress?: () => void;
  onPressQuote?: () => void;
  onPressFailed?: () => void;
};

export function MessageBubble({
  content,
  mine,
  senderName,
  tick,
  onReply,
  onLongPress,
  onPressQuote,
  onPressFailed,
}: MessageBubbleProps) {
  const colors = useThemeColors();
  const swipeable = useRef<SwipeableMethods>(null);

  const bubble = (
    <Pressable
      accessibilityRole="text"
      onLongPress={onLongPress}
      onPress={tick === "failed" ? onPressFailed : undefined}
      delayLongPress={350}
      style={[styles.row, mine ? styles.mineRow : styles.theirRow]}
    >
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }
            : { backgroundColor: colors.backgroundSurface, borderColor: colors.border },
        ]}
      >
        {senderName && (
          <AppText variant="caption" tone="accent">
            {senderName}
          </AppText>
        )}
        {content.replyTo && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to the quoted message"
            onPress={onPressQuote}
            style={[styles.quote, { borderLeftColor: colors.accentSolid, backgroundColor: colors.backgroundSunken }]}
          >
            <AppText variant="caption" tone="accent" numberOfLines={1}>
              {content.replyTo.senderName ?? "Message"}
            </AppText>
            <AppText variant="footnote" tone="secondary" numberOfLines={2}>
              {content.replyTo.deleted ? "Message deleted" : content.replyTo.preview}
            </AppText>
          </Pressable>
        )}
        {content.deleted ? (
          <AppText variant="callout" tone="tertiary" style={styles.deleted}>
            Message deleted
          </AppText>
        ) : (
          <>
            {content.body && (
              <AppText variant="callout">
                {content.body}
              </AppText>
            )}
            {content.code && <CodeBlock code={content.code} language={content.codeLanguage} selectable={false} />}
          </>
        )}
        <View style={styles.meta}>
          <AppText variant="caption" tone="tertiary">
            {timeFormat.format(new Date(content.createdAt))}
          </AppText>
          {tick && <MessageTicks state={tick} />}
        </View>
        {tick === "failed" && (
          <AppText variant="caption" tone="danger">
            Not sent. Tap to retry.
          </AppText>
        )}
      </View>
    </Pressable>
  );

  if (!onReply || content.deleted) return bubble;

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      leftThreshold={SWIPE_THRESHOLD}
      overshootLeft={false}
      renderLeftActions={() => (
        <View style={styles.replyAction}>
          <Icon name="reply" color={colors.accent} size="md" />
        </View>
      )}
      onSwipeableOpen={() => {
        haptics.selection();
        onReply();
        swipeable.current?.close();
      }}
    >
      {bubble}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: layoutSpacing.screenX,
    paddingVertical: spacing.xxs,
  },
  mineRow: {
    alignItems: "flex-end",
  },
  theirRow: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    minWidth: 96,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: componentRadius.card,
    borderWidth: 1,
  },
  quote: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 3,
    borderRadius: componentRadius.button,
    gap: spacing.xxs,
  },
  deleted: {
    fontStyle: "italic",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: spacing.xs,
  },
  replyAction: {
    width: SWIPE_THRESHOLD,
    alignItems: "center",
    justifyContent: "center",
  },
});
