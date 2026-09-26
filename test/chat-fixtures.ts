import type { ChatMember, ChatMessage, Conversation } from "@/api/chat-api";

export const ME = { id: "me", username: "me", displayName: "Me" };
export const ADA = { id: "ada", username: "ada", displayName: "Ada" };
export const KEN = { id: "ken", username: "ken", displayName: "Ken" };

export function message(seq: number, overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `m${seq}`,
    seq,
    sender: ADA,
    kind: "TEXT",
    body: `message ${seq}`,
    code: null,
    codeLanguage: null,
    createdAt: new Date(Date.UTC(2026, 8, 1, 12, 0, seq)).toISOString(),
    deleted: false,
    clientMessageId: null,
    replyTo: null,
    system: null,
    ...overrides,
  };
}

export function member(person: { id: string; username: string; displayName: string }, overrides: Partial<ChatMember> = {}): ChatMember {
  return { ...person, role: "MEMBER", status: "ACTIVE", deliveredSeq: 0, readSeq: 0, ...overrides };
}

export function conversation(id: string, overrides: Partial<Conversation> = {}): Conversation {
  return {
    id,
    kind: "DIRECT",
    title: null,
    myStatus: "ACTIVE",
    lastSeq: 0,
    myReadSeq: 0,
    unreadCount: 0,
    othersDeliveredSeq: 0,
    othersReadSeq: 0,
    lastActivityAt: "2026-09-01T12:00:00.000Z",
    members: [member(ME), member(ADA)],
    lastMessage: null,
    ...overrides,
  };
}
