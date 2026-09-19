import { readValue, removeValue, writeValue } from "@/storage/key-value";

const REFRESH_TOKEN_KEY = "devhub.session.refreshToken";

export const tokenStore = {
  read: async (): Promise<string | null> => readValue(REFRESH_TOKEN_KEY),
  write: async (token: string): Promise<void> => writeValue(REFRESH_TOKEN_KEY, token),
  clear: async (): Promise<void> => removeValue(REFRESH_TOKEN_KEY),
};
