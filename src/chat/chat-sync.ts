import { AppState } from "react-native";

import { toApiError } from "@/api/api-error";
import { chatApi } from "@/api/chat-api";
import type { RealtimeEvent } from "@/realtime/realtime-events";
import { sessionManager } from "@/session/session-manager";

import { chatStore } from "./chat-store";
import { withNewMessage, withoutMessageContent, withWatermarks } from "./conversation-state";
import { currentUserId } from "./current-user-id";
import { openConversation } from "./open-conversation";
import { receiptSync } from "./receipt-sync";
import { typing } from "./typing";

const MAX_GAP_PAGES = 10;

function isViewing(conversationId: string): boolean {
  return openConversation.get() === conversationId && AppState.currentState === "active";
}

async function quietly(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch {
    return;
  }
}

export const chatSync = {
  syncInbox: () =>
    quietly(async () => {
      const [page, requests] = await Promise.all([
        chatApi.conversations(sessionManager.client, null),
        chatApi.requests(sessionManager.client),
      ]);
      await chatStore.saveConversations([...page.items, ...requests]);
      page.items.forEach((conversation) => receiptSync.delivered(conversation.id, conversation.lastSeq));
    }),

  syncConversation: (conversationId: string) =>
    quietly(async () => {
      try {
        await chatStore.saveConversations([await chatApi.conversation(sessionManager.client, conversationId)]);
      } catch (error) {
        if (toApiError(error).code === "NOT_FOUND") await chatStore.removeConversation(conversationId);
        else throw error;
      }
    }),

  syncMessages: (conversationId: string) =>
    quietly(async () => {
      const latest = await chatStore.latestSeq(conversationId);
      if (latest === 0) {
        const page = await chatApi.messages(sessionManager.client, conversationId, {});
        await chatStore.saveMessages(conversationId, page.items, page.hasMore);
      } else {
        let after = latest;
        for (let page = 0; page < MAX_GAP_PAGES; page++) {
          const next = await chatApi.messages(sessionManager.client, conversationId, { afterSeq: after });
          if (next.items.length > 0) await chatStore.saveMessages(conversationId, next.items);
          if (!next.hasMore || next.items.length === 0) break;
          after = next.items[next.items.length - 1].seq;
        }
      }
      await chatStore.pruneHistory(conversationId);
      const newest = await chatStore.latestSeq(conversationId);
      receiptSync.delivered(conversationId, newest);
      if (isViewing(conversationId)) receiptSync.read(conversationId, newest);
    }),

  loadOlder: (conversationId: string) =>
    quietly(async () => {
      const oldest = await chatStore.oldestSeq(conversationId);
      if (oldest === null) return chatSync.syncMessages(conversationId);
      const page = await chatApi.messages(sessionManager.client, conversationId, { beforeSeq: oldest });
      await chatStore.saveMessages(conversationId, page.items, page.hasMore);
    }),

  handle: (event: RealtimeEvent) =>
    quietly(async () => {
      const conversationId = event.conversationId;
      switch (event.type) {
        case "MESSAGE_CREATED": {
          const message = event.data;
          const mine = message.sender?.id === currentUserId();
          if (message.sender) typing.stopped(conversationId, message.sender.id);
          const latest = await chatStore.latestSeq(conversationId);
          if (latest > 0) {
            await chatStore.saveMessages(conversationId, [message]);
            if (message.seq > latest + 1) await chatSync.syncMessages(conversationId);
          }
          if (await chatStore.conversation(conversationId)) {
            await chatStore.updateConversation(conversationId, (conversation) =>
              withNewMessage(conversation, message, !mine && !isViewing(conversationId)),
            );
          } else {
            await chatSync.syncConversation(conversationId);
          }
          if (!mine) {
            receiptSync.delivered(conversationId, message.seq);
            if (isViewing(conversationId)) receiptSync.read(conversationId, message.seq);
          }
          await chatStore.pruneHistory(conversationId);
          return;
        }
        case "MESSAGE_DELETED": {
          const deletedId = event.data.messageId;
          await chatStore.updateMessages(conversationId, (message) => withoutMessageContent(message, deletedId));
          await chatStore.updateConversation(conversationId, (conversation) =>
            conversation.lastMessage
              ? { ...conversation, lastMessage: withoutMessageContent(conversation.lastMessage, deletedId) }
              : conversation,
          );
          return;
        }
        case "RECEIPT_UPDATED": {
          const { userId, deliveredSeq, readSeq } = event.data;
          const myId = currentUserId();
          await chatStore.updateConversation(conversationId, (conversation) => {
            const members = conversation.members.map((member) =>
              member.id === userId ? { ...member, deliveredSeq, readSeq } : member,
            );
            const mine = userId === myId
              ? { myReadSeq: readSeq, unreadCount: Math.max(0, conversation.lastSeq - readSeq) }
              : {};
            return withWatermarks({ ...conversation, ...mine, members }, myId);
          });
          return;
        }
        case "CONVERSATION_UPDATED": {
          await chatSync.syncConversation(conversationId);
          if (openConversation.get() === conversationId) await chatSync.syncMessages(conversationId);
          return;
        }
        case "TYPING": {
          if (event.data.userId !== currentUserId()) {
            typing.received(conversationId, event.data.userId, event.data.displayName);
          }
          return;
        }
      }
    }),

  resync: async (): Promise<void> => {
    await chatSync.syncInbox();
    const open = openConversation.get();
    if (open) await chatSync.syncMessages(open);
    receiptSync.retry();
  },
};
