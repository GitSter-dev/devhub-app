import { useQueryClient } from "@tanstack/react-query";
import * as Network from "expo-network";
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

  return null;
}
