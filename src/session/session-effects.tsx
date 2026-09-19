import { useEffect } from "react";
import { AppState } from "react-native";

import { queryClient } from "@/api/query-client";
import { chatStore } from "@/chat/chat-store";
import { outgoingQueue } from "@/chat/outgoing-queue";
import { receiptSync } from "@/chat/receipt-sync";
import { typing } from "@/chat/typing";
import { followSync } from "@/features/follows/follow-sync";
import { likeSync } from "@/features/posts/like-sync";

import { sessionManager } from "./session-manager";
import { useSessionState } from "./use-session";

export function SessionEffects() {
  const session = useSessionState();
  const { status } = session;
  const online = session.status === "signedIn" && session.online;

  useEffect(() => {
    void sessionManager.hydrate();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") sessionManager.retryConnection();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (status === "signedOut" || status === "reauthRequired") {
      queryClient.clear();
      followSync.reset();
      likeSync.reset();
      receiptSync.reset();
      outgoingQueue.reset();
      typing.reset();
      void chatStore.wipe();
    }
  }, [status]);

  useEffect(() => {
    if (online) void queryClient.invalidateQueries();
  }, [online]);

  return null;
}
