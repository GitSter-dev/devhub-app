import { createStore, useStore } from "@/state/create-store";

export type AuthNotice = { tone: "success" | "info" | "error"; message: string };

const noticeStore = createStore<AuthNotice | null>(null);

export function flashAuthNotice(notice: AuthNotice): void {
  noticeStore.set(notice);
}

export function clearAuthNotice(): void {
  noticeStore.set(null);
}

export function useAuthNotice(): AuthNotice | null {
  return useStore(noticeStore);
}
