import { realtimeConnection } from "@/realtime/realtime-connection";
import { createStore, useStore } from "@/state/create-store";

const VISIBLE_MS = 5_000;
const SEND_EVERY_MS = 3_000;

type Typists = ReadonlyMap<string, ReadonlyMap<string, string>>;

const typingStore = createStore<Typists>(new Map());
const expiries = new Map<string, ReturnType<typeof setTimeout>>();
const lastSent = new Map<string, number>();

function update(conversationId: string, change: (typists: Map<string, string>) => void): void {
  const next = new Map(typingStore.get());
  const typists = new Map(next.get(conversationId) ?? []);
  change(typists);
  if (typists.size > 0) next.set(conversationId, typists);
  else next.delete(conversationId);
  typingStore.set(next);
}

export const typing = {
  received(conversationId: string, userId: string, displayName: string): void {
    const key = `${conversationId}:${userId}`;
    const existing = expiries.get(key);
    if (existing) clearTimeout(existing);
    update(conversationId, (typists) => typists.set(userId, displayName));
    expiries.set(key, setTimeout(() => typing.stopped(conversationId, userId), VISIBLE_MS));
  },
  stopped(conversationId: string, userId: string): void {
    const key = `${conversationId}:${userId}`;
    const existing = expiries.get(key);
    if (existing) clearTimeout(existing);
    expiries.delete(key);
    update(conversationId, (typists) => typists.delete(userId));
  },
  announce(conversationId: string): void {
    const now = Date.now();
    if (now - (lastSent.get(conversationId) ?? 0) < SEND_EVERY_MS) return;
    lastSent.set(conversationId, now);
    realtimeConnection.publish(`/app/conversations/${conversationId}/typing`);
  },
  reset(): void {
    expiries.forEach((timer) => clearTimeout(timer));
    expiries.clear();
    lastSent.clear();
    typingStore.set(new Map());
  },
};

export function useTypists(conversationId: string): string[] {
  const typists = useStore(typingStore).get(conversationId);
  return typists ? [...typists.values()] : [];
}
