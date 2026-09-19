import { useQuery, type QueryClient } from "@tanstack/react-query";

import { chatStore } from "./chat-store";

export const chatKeys = {
  all: ["chat"] as const,
  inbox: ["chat", "inbox"] as const,
  requests: ["chat", "requests"] as const,
  conversation: (id: string) => ["chat", "conversation", id] as const,
  messages: (id: string) => ["chat", "messages", id] as const,
};

const LOCAL = { staleTime: Infinity, networkMode: "always" } as const;

export function bindChatStore(queryClient: QueryClient): () => void {
  return chatStore.onChange((change) => {
    if (change.inbox) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.inbox });
      void queryClient.invalidateQueries({ queryKey: chatKeys.requests });
    }
    if (change.conversationId) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversation(change.conversationId) });
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(change.conversationId) });
    } else if (change.inbox) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    }
  });
}

export function useInbox() {
  return useQuery({ queryKey: chatKeys.inbox, queryFn: () => chatStore.conversations("ACTIVE"), ...LOCAL });
}

export function useRequests() {
  return useQuery({ queryKey: chatKeys.requests, queryFn: () => chatStore.conversations("REQUEST"), ...LOCAL });
}

export function useConversation(id: string) {
  return useQuery({ queryKey: chatKeys.conversation(id), queryFn: () => chatStore.conversation(id), ...LOCAL });
}

export function useChatMessages(id: string) {
  return useQuery({
    queryKey: chatKeys.messages(id),
    queryFn: async () => {
      const [messages, outgoing, hasOlder] = await Promise.all([
        chatStore.messages(id),
        chatStore.outgoing(id),
        chatStore.hasOlder(id),
      ]);
      return { messages, outgoing, hasOlder };
    },
    ...LOCAL,
  });
}

export function useUnreadTotal(): number {
  const inbox = useInbox().data ?? [];
  return inbox.reduce((total, conversation) => total + conversation.unreadCount, 0);
}
