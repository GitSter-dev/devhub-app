import { vi } from "vitest";

const values = new Map<string, string>();

export const getItemAsync = vi.fn(async (key: string): Promise<string | null> => values.get(key) ?? null);
export const setItemAsync = vi.fn(async (key: string, value: string): Promise<void> => {
  values.set(key, value);
});
export const deleteItemAsync = vi.fn(async (key: string): Promise<void> => {
  values.delete(key);
});

export const WHEN_UNLOCKED = "WHEN_UNLOCKED";
export const AFTER_FIRST_UNLOCK = "AFTER_FIRST_UNLOCK";
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY";
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = "WHEN_UNLOCKED_THIS_DEVICE_ONLY";

export function resetSecureStore(): void {
  values.clear();
}
