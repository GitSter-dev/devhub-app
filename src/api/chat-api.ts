import type { KyInstance } from "ky";

import { unwrap } from "./http-client";

export type PersonRef = { id: string; username: string; displayName: string };

export type MemberStatus = "ACTIVE" | "REQUEST" | "DECLINED" | "LEFT";

export type ChatMember = PersonRef & {
  role: "OWNER" | "MEMBER";
  status: MemberStatus;
  deliveredSeq: number | null;
  readSeq: number | null;
};

export type SystemEventType =
  | "GROUP_CREATED"
  | "GROUP_RENAMED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_LEFT"
  | "OWNER_CHANGED";

export type ChatMessage = {
  id: string;
  seq: number;
  sender: PersonRef | null;
  kind: "TEXT" | "SYSTEM";
  body: string | null;
  code: string | null;
  codeLanguage: string | null;
  createdAt: string;
  deleted: boolean;
  clientMessageId: string | null;
  replyTo: { id: string; seq: number; senderName: string | null; preview: string | null; deleted: boolean } | null;
  system: { type: SystemEventType; actor: PersonRef | null; target: PersonRef | null; detail: string | null } | null;
};

export type Conversation = {
  id: string;
  kind: "DIRECT" | "GROUP";
  title: string | null;
  myStatus: MemberStatus;
  lastSeq: number;
  myReadSeq: number;
  unreadCount: number;
  othersDeliveredSeq: number;
  othersReadSeq: number;
  lastActivityAt: string;
  members: ChatMember[];
  lastMessage: ChatMessage | null;
};

export type ConversationPage = { items: Conversation[]; nextCursor: string | null };
export type MessagePage = { items: ChatMessage[]; hasMore: boolean };

export type OutgoingMessage = {
  clientMessageId: string;
  body: string | null;
  code: string | null;
  codeLanguage: string | null;
  replyToId: string | null;
};

export const chatApi = {
  conversations: (client: KyInstance, cursor: string | null) =>
    unwrap<ConversationPage>(client.get("conversations", { searchParams: cursor ? { cursor } : {} })),
  requests: (client: KyInstance) => unwrap<Conversation[]>(client.get("conversations/requests")),
  conversation: (client: KyInstance, id: string) => unwrap<Conversation>(client.get(`conversations/${id}`)),
  openDirect: (client: KyInstance, userId: string) =>
    unwrap<Conversation>(client.post("conversations/direct", { json: { userId } })),
  createGroup: (client: KyInstance, title: string, memberIds: string[]) =>
    unwrap<Conversation>(client.post("conversations/groups", { json: { title, memberIds } })),
  rename: (client: KyInstance, id: string, title: string) =>
    unwrap<Conversation>(client.patch(`conversations/${id}`, { json: { title } })),
  addMembers: (client: KyInstance, id: string, userIds: string[]) =>
    unwrap<Conversation>(client.post(`conversations/${id}/members`, { json: { userIds } })),
  removeMember: (client: KyInstance, id: string, userId: string) =>
    unwrap<void>(client.delete(`conversations/${id}/members/${userId}`)),
  accept: (client: KyInstance, id: string) => unwrap<Conversation>(client.post(`conversations/${id}/accept`)),
  decline: (client: KyInstance, id: string) => unwrap<void>(client.post(`conversations/${id}/decline`)),
  messages: (client: KyInstance, id: string, page: { beforeSeq?: number; afterSeq?: number }) =>
    unwrap<MessagePage>(
      client.get(`conversations/${id}/messages`, {
        searchParams: {
          ...(page.beforeSeq != null ? { beforeSeq: page.beforeSeq } : {}),
          ...(page.afterSeq != null ? { afterSeq: page.afterSeq } : {}),
        },
      }),
    ),
  send: (client: KyInstance, id: string, message: OutgoingMessage) =>
    unwrap<ChatMessage>(client.post(`conversations/${id}/messages`, { json: message, retry: 0 })),
  deleteMessage: (client: KyInstance, id: string, messageId: string) =>
    unwrap<void>(client.delete(`conversations/${id}/messages/${messageId}`)),
  receipts: (client: KyInstance, id: string, deliveredSeq: number, readSeq: number) =>
    unwrap<{ deliveredSeq: number; readSeq: number }>(
      client.put(`conversations/${id}/receipts`, { json: { deliveredSeq, readSeq } }),
    ),
};
