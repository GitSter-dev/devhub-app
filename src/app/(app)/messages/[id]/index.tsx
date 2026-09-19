import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { chatApi, type ChatMessage } from "@/api/chat-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { useChatMessages, useConversation } from "@/chat/chat-queries";
import { chatStore, type OutgoingRow } from "@/chat/chat-store";
import { chatSync } from "@/chat/chat-sync";
import { withoutMessageContent } from "@/chat/conversation-state";
import { openConversation } from "@/chat/open-conversation";
import { outgoingQueue } from "@/chat/outgoing-queue";
import { receiptSync } from "@/chat/receipt-sync";
import { ChatComposer } from "@/features/chat/chat-composer";
import { conversationHandle, conversationTitle, outgoingTick, systemText, tickFor } from "@/features/chat/conversation-display";
import { MessageBubble } from "@/features/chat/message-bubble";
import { SystemLine } from "@/features/chat/system-line";
import { TypingRow } from "@/features/chat/typing-row";
import { realtimeConnection } from "@/realtime/realtime-connection";
import { sessionManager } from "@/session/session-manager";
import { useCurrentUser } from "@/session/use-session";
import { useStore } from "@/state/create-store";
import { hitSlop, layoutSpacing, minTouchTarget, spacing, useThemeColors } from "@/theme";

type Item =
  | { kind: "message"; key: string; message: ChatMessage }
  | { kind: "outgoing"; key: string; row: OutgoingRow }
  | { kind: "day"; key: string; label: string };

const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });

function dayOf(iso: string): string {
  return new Date(iso).toDateString();
}

function buildItems(messages: ChatMessage[], outgoing: OutgoingRow[]): Item[] {
  const ordered: (Item & { at: string })[] = [
    ...messages.map((message) => ({ kind: "message" as const, key: message.id, message, at: message.createdAt })),
    ...outgoing.map((row) => ({ kind: "outgoing" as const, key: row.clientMessageId, row, at: row.createdAt })),
  ];
  const items: Item[] = [];
  let previousDay: string | null = null;
  for (const item of ordered) {
    const day = dayOf(item.at);
    if (day !== previousDay) {
      items.push({ kind: "day", key: `day-${day}`, label: dayFormat.format(new Date(item.at)) });
      previousDay = day;
    }
    items.push(item);
  }
  return items.reverse();
}

export default function ChatScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useCurrentUser().data?.id ?? null;
  const conversation = useConversation(id).data ?? null;
  const { data } = useChatMessages(id);
  const connection = useStore(realtimeConnection.store);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const list = useRef<FlatList<Item>>(null);

  const messages = useMemo(() => data?.messages ?? [], [data]);
  const outgoing = useMemo(() => data?.outgoing ?? [], [data]);
  const items = useMemo(() => buildItems(messages, outgoing), [messages, outgoing]);
  const newestSeq = messages.length > 0 ? messages[messages.length - 1].seq : 0;

  useEffect(() => {
    openConversation.set(id);
    void chatSync.syncConversation(id);
    void chatSync.syncMessages(id);
    return () => {
      if (openConversation.get() === id) openConversation.set(null);
    };
  }, [id]);

  useEffect(() => {
    const markRead = () => {
      if (AppState.currentState === "active" && newestSeq > 0) receiptSync.read(id, newestSeq);
    };
    markRead();
    const subscription = AppState.addEventListener("change", markRead);
    return () => subscription.remove();
  }, [id, newestSeq]);

  if (!conversation) {
    return <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]} />;
  }

  const title = conversationTitle(conversation, myId);
  const offline = connection.status !== "connected";
  const pending = conversation.myStatus === "REQUEST";
  const isGroup = conversation.kind === "GROUP";

  const jumpTo = (messageId: string) => {
    const index = items.findIndex((item) => item.kind === "message" && item.message.id === messageId);
    if (index >= 0) list.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  const deleteMessage = (message: ChatMessage) =>
    Alert.alert("Delete for everyone?", "Everyone in this chat will see “Message deleted”.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void chatApi
            .deleteMessage(sessionManager.client, id, message.id)
            .then(() => chatStore.updateMessages(id, (candidate) => withoutMessageContent(candidate, message.id)))
            .catch(() => Alert.alert("Couldn't delete the message", "Check your connection and try again."));
        },
      },
    ]);

  const messageMenu = (message: ChatMessage, mine: boolean) =>
    Alert.alert(
      "Message",
      undefined,
      [
        { text: "Reply", onPress: () => setReplyTo(message) },
        ...(mine ? [{ text: "Delete for everyone", style: "destructive" as const, onPress: () => deleteMessage(message) }] : []),
        { text: "Cancel", style: "cancel" as const },
      ],
    );

  const failedMenu = (row: OutgoingRow) =>
    Alert.alert("Message not sent", row.error ?? undefined, [
      { text: "Retry", onPress: () => void outgoingQueue.retry(row) },
      { text: "Delete", style: "destructive", onPress: () => void outgoingQueue.discard(row) },
      { text: "Cancel", style: "cancel" },
    ]);

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    if (item.kind === "day") {
      return <SystemLine text={item.label} />;
    }
    if (item.kind === "outgoing") {
      return (
        <MessageBubble
          content={{
            body: item.row.body,
            code: item.row.code,
            codeLanguage: item.row.codeLanguage,
            deleted: false,
            createdAt: item.row.createdAt,
            replyTo: item.row.replyPreview,
          }}
          mine
          senderName={null}
          tick={outgoingTick(item.row)}
          onPressFailed={() => failedMenu(item.row)}
        />
      );
    }
    const message = item.message;
    if (message.kind === "SYSTEM") return <SystemLine text={systemText(message, myId)} />;
    const mine = message.sender?.id === myId;
    const older = items[index + 1];
    const startsRun = !(older?.kind === "message" && older.message.kind === "TEXT" && older.message.sender?.id === message.sender?.id);
    return (
      <MessageBubble
        content={message}
        mine={mine}
        senderName={isGroup && !mine && startsRun ? (message.sender?.displayName ?? null) : null}
        tick={mine ? tickFor(message, conversation) : null}
        onReply={pending ? undefined : () => setReplyTo(message)}
        onLongPress={pending ? undefined : () => messageMenu(message, mine)}
        onPressQuote={message.replyTo ? () => jumpTo(message.replyTo!.id) : undefined}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={hitSlop} onPress={() => router.back()} style={styles.back}>
          <Icon name="back" color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole={isGroup ? "button" : "header"}
          accessibilityHint={isGroup ? "Opens group info" : undefined}
          disabled={!isGroup}
          onPress={() => router.push({ pathname: "/messages/[id]/info", params: { id } })}
          style={styles.titleBlock}
        >
          <AppText variant="headline" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" tone={offline ? "warning" : "tertiary"} numberOfLines={1}>
            {offline ? "Waiting for network…" : conversationHandle(conversation, myId)}
          </AppText>
        </Pressable>
      </View>

      <FlatList
        ref={list}
        inverted
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        onEndReached={() => {
          if (data?.hasOlder) void chatSync.loadOlder(id);
        }}
        onEndReachedThreshold={0.4}
        onScrollToIndexFailed={() => undefined}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />

      <TypingRow conversationId={id} />

      {pending ? (
        <View style={[styles.request, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border }]}>
          <AppText variant="body" tone="secondary" center>
            {`${title} wants to message you. They won't see that you've read this until you accept.`}
          </AppText>
          <View style={styles.requestActions}>
            <View style={styles.flex}>
              <Button
                label="Decline"
                variant="secondary"
                onPress={() =>
                  void chatApi.decline(sessionManager.client, id).then(async () => {
                    await chatStore.removeConversation(id);
                    router.back();
                  })
                }
              />
            </View>
            <View style={styles.flex}>
              <Button
                label="Accept"
                onPress={() =>
                  void chatApi.accept(sessionManager.client, id).then((accepted) => chatStore.saveConversations([accepted]))
                }
              />
            </View>
          </View>
        </View>
      ) : (
        <ChatComposer
          conversationId={id}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={(draft) => {
            void outgoingQueue.send(id, { ...draft, replyTo });
            setReplyTo(null);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: layoutSpacing.screenX,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  request: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: layoutSpacing.screenX,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  requestActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
