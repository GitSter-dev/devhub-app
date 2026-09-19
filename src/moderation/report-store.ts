import type { ReportTargetType } from "@/api/reports-api";
import { createStore, useStore } from "@/state/create-store";

export type ReportTarget = {
  type: ReportTargetType;
  id: string;
  username: string | null;
  userId: string | null;
  conversationId?: string;
};

const store = createStore<ReportTarget | null>(null);

export const reportFlow = {
  open(target: ReportTarget): void {
    store.set(target);
  },
  close(): void {
    store.set(null);
  },
};

export function useReportTarget(): ReportTarget | null {
  return useStore(store);
}
