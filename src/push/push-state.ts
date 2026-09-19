import { readValue, writeValue } from "@/storage/key-value";
import { createStore, useStore } from "@/state/create-store";

import type { PushPermission } from "./push-permission";

const DISMISSED_KEY = "devhub.push.promptDismissed";

export type PushState =
  | { status: "unknown" }
  | { status: "unsupported" }
  | { status: "permission"; permission: Exclude<PushPermission, "granted"> }
  | { status: "registering" }
  | { status: "enabled" }
  | { status: "failed"; message: string };

const pushStore = createStore<PushState>({ status: "unknown" });
const dismissedStore = createStore(readValue(DISMISSED_KEY) === "true");

export function setPushState(state: PushState): void {
  pushStore.set(state);
}

export function usePushState(): PushState {
  return useStore(pushStore);
}

export function dismissPushPrompt(): void {
  writeValue(DISMISSED_KEY, "true");
  dismissedStore.set(true);
}

export function usePushPromptDismissed(): boolean {
  return useStore(dismissedStore);
}
