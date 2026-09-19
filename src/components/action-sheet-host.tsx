import { createStore, useStore } from "@/state/create-store";

import { ActionSheet, type SheetAction } from "./action-sheet";

const store = createStore<SheetAction[] | null>(null);

export const actionSheet = {
  open(actions: SheetAction[]): void {
    store.set(actions);
  },
  close(): void {
    store.set(null);
  },
};

export function ActionSheetHost() {
  const actions = useStore(store);

  return <ActionSheet visible={actions !== null} actions={actions ?? []} onClose={actionSheet.close} />;
}
