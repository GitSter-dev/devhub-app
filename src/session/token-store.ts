import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "devhub.session.refreshToken";

export const tokenStore = {
  read: (): Promise<string | null> => SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null),
  write: (token: string): Promise<void> => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  clear: (): Promise<void> => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined),
};
