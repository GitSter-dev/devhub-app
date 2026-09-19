import { readValue, writeValue } from "@/storage/key-value";
import { createStore, useStore } from "@/state/create-store";

const SEEN_KEY = "devhub.onboarding.seen";

const seenStore = createStore(readValue(SEEN_KEY) === "true");

export function markOnboardingSeen(): void {
  writeValue(SEEN_KEY, "true");
  seenStore.set(true);
}

export function useHasSeenOnboarding(): boolean {
  return useStore(seenStore);
}
