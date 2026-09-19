import { readValue, removeValue, writeValue } from "@/storage/key-value";

import type { TokenRead } from "./token-store";

const REFRESH_TOKEN_KEY = "devhub.session.refreshToken";

export const tokenStore = {
  read: async (): Promise<TokenRead> => {
    const token = readValue(REFRESH_TOKEN_KEY);
    return token ? { kind: "found", token } : { kind: "missing" };
  },
  write: async (token: string): Promise<void> => writeValue(REFRESH_TOKEN_KEY, token),
  clear: async (): Promise<void> => removeValue(REFRESH_TOKEN_KEY),
};
