import { createStore, useStore } from "@/state/create-store";

const openStore = createStore<string | null>(null);

export const openConversation = {
  get: (): string | null => openStore.get(),
  set: (conversationId: string | null): void => openStore.set(conversationId),
};

export function useOpenConversation(): string | null {
  return useStore(openStore);
}
