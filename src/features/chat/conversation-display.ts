import type { ChatMessage, Conversation } from "@/api/chat-api";
import type { OutgoingRow } from "@/chat/chat-store";

export type TickState = "pending" | "failed" | "sent" | "delivered" | "read";

export function conversationTitle(conversation: Conversation, myId: string | null): string {
  if (conversation.kind === "GROUP") return conversation.title ?? "Group";
  const other = conversation.members.find((member) => member.id !== myId);
  return other?.displayName ?? "Conversation";
}

export function conversationHandle(conversation: Conversation, myId: string | null): string | null {
  if (conversation.kind === "GROUP") return `${conversation.members.length} members`;
  const other = conversation.members.find((member) => member.id !== myId);
  return other ? `@${other.username}` : null;
}

export function tickFor(message: ChatMessage, conversation: Conversation): TickState {
  if (message.seq <= conversation.othersReadSeq) return "read";
  if (message.seq <= conversation.othersDeliveredSeq) return "delivered";
  return "sent";
}

export function outgoingTick(row: OutgoingRow): TickState {
  return row.state === "failed" ? "failed" : "pending";
}

export function systemText(message: ChatMessage, myId: string | null): string {
  const system = message.system;
  if (!system) return "";
  const name = (person: ChatMessage["sender"]) => (person ? (person.id === myId ? "You" : person.displayName) : "Someone");
  const actor = name(system.actor);
  const target = name(system.target);
  switch (system.type) {
    case "GROUP_CREATED":
      return `${actor} created “${system.detail ?? "the group"}”`;
    case "GROUP_RENAMED":
      return `${actor} renamed the group to “${system.detail ?? ""}”`;
    case "MEMBER_ADDED":
      return `${actor} added ${target}`;
    case "MEMBER_REMOVED":
      return `${actor} removed ${target}`;
    case "MEMBER_LEFT":
      return `${actor} left`;
    case "OWNER_CHANGED":
      return `${target} ${target === "You" ? "are" : "is"} now the group owner`;
  }
}

export function messagePreview(message: ChatMessage | null, myId: string | null): string {
  if (!message) return "No messages yet";
  if (message.kind === "SYSTEM") return systemText(message, myId);
  if (message.deleted) return "Message deleted";
  const text = message.body ?? (message.code ? "Code snippet" : "");
  return message.sender?.id === myId ? `You: ${text}` : text;
}
