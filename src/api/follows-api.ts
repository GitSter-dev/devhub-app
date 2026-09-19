import type { KyInstance } from "ky";

import { unwrap } from "./http-client";

export function followUser(client: KyInstance, userId: string): Promise<void> {
  return unwrap<void>(client.put(`users/me/following/${userId}`));
}

export function unfollowUser(client: KyInstance, userId: string): Promise<void> {
  return unwrap<void>(client.delete(`users/me/following/${userId}`));
}
