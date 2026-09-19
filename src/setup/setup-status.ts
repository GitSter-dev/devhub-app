import { useEffect } from "react";

import { useStore, createStore } from "@/state/create-store";
import { readValue, removeValue, writeValue } from "@/storage/key-value";
import { useCurrentUser, useSessionState } from "@/session/use-session";

export type SetupStatus = "unknown" | "pending" | "completed" | "unavailable";

const COMPLETED_KEY = "devhub.setup.completed";

const completedStore = createStore(readValue(COMPLETED_KEY) === "true");

export function rememberSetupCompleted(): void {
  writeValue(COMPLETED_KEY, "true");
  completedStore.set(true);
}

function forgetSetupCompleted(): void {
  removeValue(COMPLETED_KEY);
  completedStore.set(false);
}

export function useSetupStatus(): SetupStatus {
  const remembered = useStore(completedStore);
  const { status } = useSessionState();
  const { data: user, isError } = useCurrentUser();

  useEffect(() => {
    if (status === "signedOut" || status === "reauthRequired") forgetSetupCompleted();
  }, [status]);

  useEffect(() => {
    if (!user) return;
    if (user.setupCompleted) rememberSetupCompleted();
    else forgetSetupCompleted();
  }, [user]);

  if (user) return user.setupCompleted ? "completed" : "pending";
  if (remembered) return "completed";
  return isError ? "unavailable" : "unknown";
}
