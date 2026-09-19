import type { KyInstance } from "ky";

import type { TokenPair } from "./auth-api";
import { publicClient, unwrap } from "./http-client";

export const accountApi = {
  requestDeletion: (client: KyInstance, password: string) =>
    unwrap<void>(client.post("users/me/deletion", { json: { password } })),
  restore: (identifier: string, password: string) =>
    unwrap<TokenPair>(publicClient.post("auth/restore", { json: { identifier, password } })),
};
