import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { useInbox, useRequests } from "@/chat/chat-queries";
import { chatSync } from "@/chat/chat-sync";
import { ConversationRow } from "@/features/chat/conversation-row";
import { useCurrentUser } from "@/session/use-session";
import { componentRadius, hitSlop, layoutSpacing, maxContentWidth, minTouchTarget, spacing, useThemeColors } from "@/theme";

type Segment = "chats" | "requests";

export default function MessagesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const myId = useCurrentUser().data?.id ?? null;
  const inbox = useInbox().data ?? [];
  const requests = useRequests().data ?? [];
  const [segment, setSegment] = useState<Segment>("chats");

  useFocusEffect(
    useCallback(() => {
      void chatSync.syncInbox();
    }, []),
  );

  const data = segment === "chats" ? inbox : requests;

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <FlatList
        data={data}
        keyExtractor={(conversation) => conversation.id}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            myId={myId}
            onPress={() => router.push({ pathname: "/messages/[id]", params: { id: item.id } })}
          />
        )}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              title="Messages"
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="New message"
                  hitSlop={hitSlop}
                  onPress={() => router.push("/messages/new")}
                  style={[styles.iconButton, { backgroundColor: colors.accentSolid }]}
                >
                  <Icon name="compose" color={colors.onAccentSolid} size="sm" />
                </Pressable>
              }
            />
            <View style={[styles.segments, { backgroundColor: colors.backgroundSunken }]}>
              {(["chats", "requests"] as const).map((value) => {
                const selected = segment === value;
                const label = value === "chats" ? "Chats" : `Requests${requests.length ? ` (${requests.length})` : ""}`;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setSegment(value)}
                    style={[styles.segment, selected && { backgroundColor: colors.backgroundSurface }]}
                  >
                    <AppText variant="subhead" tone={selected ? "primary" : "secondary"}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <AppText variant="body" tone="tertiary" center style={styles.empty}>
            {segment === "chats"
              ? "No conversations yet. Start one with the pencil button."
              : "No message requests. People you don't follow land here first."}
          </AppText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layoutSpacing.screenX,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  segments: {
    flexDirection: "row",
    padding: spacing.xxs,
    borderRadius: componentRadius.button,
  },
  segment: {
    flex: 1,
    minHeight: minTouchTarget - spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: componentRadius.button,
  },
  empty: {
    marginTop: spacing.xl,
  },
});
