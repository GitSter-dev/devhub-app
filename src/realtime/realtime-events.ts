import type { ChatMessage } from "@/api/chat-api";

export type ChatEvent =
  | { type: "MESSAGE_CREATED"; conversationId: string; data: ChatMessage }
  | { type: "MESSAGE_DELETED"; conversationId: string; data: { messageId: string } }
  | { type: "RECEIPT_UPDATED"; conversationId: string; data: { userId: string; deliveredSeq: number; readSeq: number } }
  | { type: "CONVERSATION_UPDATED"; conversationId: string; data: Record<string, never> }
  | { type: "TYPING"; conversationId: string; data: { userId: string; displayName: string } };

export type RealtimeEvent = ChatEvent | { type: "NOTIFICATIONS_CHANGED"; conversationId: null; data: Record<string, never> };

export function isChatEvent(event: RealtimeEvent): event is ChatEvent {
  return event.type !== "NOTIFICATIONS_CHANGED";
}

type EventListener = (event: RealtimeEvent) => void;
type ResyncListener = () => void;

const eventListeners = new Set<EventListener>();
const resyncListeners = new Set<ResyncListener>();

export const realtimeEvents = {
  emit(event: RealtimeEvent): void {
    eventListeners.forEach((listener) => listener(event));
  },
  emitResync(): void {
    resyncListeners.forEach((listener) => listener());
  },
  subscribe(listener: EventListener): () => void {
    eventListeners.add(listener);
    return () => eventListeners.delete(listener);
  },
  onResync(listener: ResyncListener): () => void {
    resyncListeners.add(listener);
    return () => resyncListeners.delete(listener);
  },
};
