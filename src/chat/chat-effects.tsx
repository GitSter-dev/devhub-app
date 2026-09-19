import { useQueryClient } from "@tanstack/react-query";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";

import { realtimeEvents } from "@/realtime/realtime-events";

import { bindChatStore } from "./chat-queries";
import { chatSync } from "./chat-sync";
import { outgoingQueue } from "./outgoing-queue";

export function ChatEffects() {
  const queryClient = useQueryClient();

  useEffect(() => bindChatStore(queryClient), [queryClient]);

  useEffect(() => {
    void chatSync.syncInbox();
    outgoingQueue.wake();
    const unsubscribeEvents = realtimeEvents.subscribe((event) => void chatSync.handle(event));
    const unsubscribeResync = realtimeEvents.onResync(() => {
      void chatSync.resync();
      outgoingQueue.wake();
    });
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") outgoingQueue.wake();
    });
    const network = Network.addNetworkStateListener((state) => {
      if (state.isConnected) outgoingQueue.wake();
    });
    return () => {
      unsubscribeEvents();
      unsubscribeResync();
      appState.remove();
      network.remove();
    };
  }, []);

  useEffect(() => {
    const open = (data: unknown) => {
      const payload = data as { kind?: string; conversationId?: string } | undefined;
      if (payload?.kind === "chat" && payload.conversationId) {
        router.push({ pathname: "/messages/[id]", params: { id: payload.conversationId } });
      }
    };
    const handled = new Set<string>();
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response || handled.has(response.notification.request.identifier)) return;
      handled.add(response.notification.request.identifier);
      open(response.notification.request.content.data);
    };
    void Notifications.getLastNotificationResponseAsync().then(handle);
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, []);

  return null;
}
