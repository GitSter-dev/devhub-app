import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "devhub.session.refreshToken";
const RETRY_DELAYS_MS = [150, 300, 600];

export type TokenRead = { kind: "found"; token: string } | { kind: "missing" } | { kind: "error"; error: unknown };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetries<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_DELAYS_MS.length) await delay(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw lastError;
}

export const tokenStore = {
  async read(): Promise<TokenRead> {
    try {
      const token = await withRetries(() => SecureStore.getItemAsync(REFRESH_TOKEN_KEY));
      return token ? { kind: "found", token } : { kind: "missing" };
    } catch (error) {
      return { kind: "error", error };
    }
  },
  write: (token: string): Promise<void> => withRetries(() => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)),
  clear: (): Promise<void> =>
    withRetries(() => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)).catch(() => undefined),
};
