import { Storage } from "expo-sqlite/kv-store";

const STORAGE_KEY = "devhub.theme.preference";

/**
 * Native persistence for the theme preference, on expo-sqlite's key-value store.
 *
 * Reads are synchronous so the very first frame is already in the right scheme,
 * and every access is guarded: a theme preference is never worth crashing over.
 * See `preference-storage.web.ts` for the browser counterpart — Metro picks the
 * right one per platform, which also keeps expo-sqlite's wasm out of the web bundle.
 */
export function readStoredPreference(): string | null {
  try {
    return Storage.getItemSync(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredPreference(value: string): void {
  try {
    Storage.setItemSync(STORAGE_KEY, value);
  } catch {
    // Non-fatal: the choice still applies for this session.
  }
}
