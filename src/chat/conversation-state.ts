import type { ChatMessage, Conversation } from "@/api/chat-api";

export function withWatermarks(conversation: Conversation, myId: string | null): Conversation {
  const others = conversation.members.filter((member) => member.id !== myId);
  const visible = (value: number | null, status: string) => (status === "ACTIVE" ? (value ?? 0) : 0);
  return {
    ...conversation,
    othersDeliveredSeq: others.length ? Math.min(...others.map((m) => visible(m.deliveredSeq, m.status))) : 0,
    othersReadSeq: others.length ? Math.min(...others.map((m) => visible(m.readSeq, m.status))) : 0,
  };
}

export function withNewMessage(conversation: Conversation, message: ChatMessage, countsAsUnread: boolean): Conversation {
  const isNewest = message.seq >= (conversation.lastMessage?.seq ?? 0);
  return {
    ...conversation,
    lastSeq: Math.max(conversation.lastSeq, message.seq),
    lastMessage: isNewest ? message : conversation.lastMessage,
    lastActivityAt: isNewest ? message.createdAt : conversation.lastActivityAt,
    unreadCount: countsAsUnread ? conversation.unreadCount + 1 : conversation.unreadCount,
  };
}

export function withoutMessageContent(message: ChatMessage, deletedId: string): ChatMessage {
  if (message.id === deletedId) return { ...message, deleted: true, body: null, code: null, codeLanguage: null };
  if (message.replyTo?.id === deletedId) return { ...message, replyTo: { ...message.replyTo, deleted: true, preview: null } };
  return message;
}
