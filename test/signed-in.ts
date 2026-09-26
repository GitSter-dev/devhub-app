import { sessionManager } from "@/session/session-manager";

import { tokenPair } from "./tokens";

export async function signIn(): Promise<void> {
  await sessionManager.startSession(tokenPair("me", 60 * 60_000));
}
