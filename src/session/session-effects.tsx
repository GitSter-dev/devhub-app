import { useEffect } from "react";
import { AppState } from "react-native";

import { queryClient } from "@/api/query-client";

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
    if (status === "signedOut" || status === "reauthRequired") queryClient.clear();
  }, [status]);

  useEffect(() => {
    if (online) void queryClient.invalidateQueries();
  }, [online]);

  return null;
}
