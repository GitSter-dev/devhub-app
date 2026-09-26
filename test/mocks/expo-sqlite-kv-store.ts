const values = new Map<string, string>();

export const Storage = {
  getItemSync: (key: string): string | null => values.get(key) ?? null,
  setItemSync: (key: string, value: string): void => {
    values.set(key, value);
  },
  removeItemSync: (key: string): void => {
    values.delete(key);
  },
  clearSync: (): void => values.clear(),
};

export function resetKeyValueStore(): void {
  values.clear();
}
