const STORAGE_KEY = "devhub.theme.preference";

/**
 * Web counterpart of `preference-storage.ts`. localStorage is already the right
 * primitive here, and using it keeps expo-sqlite's wasm worker — which Metro
 * can't bundle for web without extra config — out of the static web build.
 *
 * Guarded because localStorage throws in private mode and when site data is blocked.
 */
export function readStoredPreference(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeStoredPreference(value: string): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value);
  } catch {
    // Non-fatal: the choice still applies for this session.
  }
}
