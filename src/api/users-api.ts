import type { KyInstance } from "ky";

import { unwrap } from "./http-client";

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  setupCompleted: boolean;
  createdAt: string;
};

export function fetchCurrentUser(client: KyInstance): Promise<CurrentUser> {
  return unwrap<CurrentUser>(client.get("users/me"));
}

export function completeSetup(client: KyInstance): Promise<CurrentUser> {
  return unwrap<CurrentUser>(client.put("users/me/setup-completion"));
}
