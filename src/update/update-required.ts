import { createStore, useStore } from "@/state/create-store";

// Flips once, when the backend says this build is too old. Nothing clears it: the
// only way forward is installing the newer build, which starts a fresh process.
export const updateRequiredStore = createStore(false);

export function useUpdateRequired(): boolean {
  return useStore(updateRequiredStore);
}
