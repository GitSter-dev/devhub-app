export function readValue(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeValue(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {}
}

export function removeValue(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {}
}
