import { Storage } from "expo-sqlite/kv-store";

export function readValue(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

export function writeValue(key: string, value: string): void {
  try {
    Storage.setItemSync(key, value);
  } catch {}
}

export function removeValue(key: string): void {
  try {
    Storage.removeItemSync(key);
  } catch {}
}
