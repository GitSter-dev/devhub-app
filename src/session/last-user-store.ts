import { readValue, removeValue, writeValue } from "@/storage/key-value";

const LAST_USER_KEY = "devhub.session.lastUser";

export type LastUser = { id?: string; username: string; displayName: string };

function isLastUser(value: unknown): value is LastUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LastUser).username === "string" &&
    typeof (value as LastUser).displayName === "string"
  );
}

export const lastUserStore = {
  read(): LastUser | null {
    try {
      const parsed: unknown = JSON.parse(readValue(LAST_USER_KEY) ?? "null");
      return isLastUser(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  write(user: LastUser): void {
    writeValue(LAST_USER_KEY, JSON.stringify({ id: user.id, username: user.username, displayName: user.displayName }));
  },
  clear(): void {
    removeValue(LAST_USER_KEY);
  },
};
