import type { SessionState } from "@/session/session-manager";

const EXPIRED_MESSAGE = "Your session expired. Sign in again to pick up where you left off.";
const REPLACED_MESSAGE = "You were signed out because your account signed in on another device.";

export function reauthMessage(state: SessionState): string | null {
  if (state.status !== "reauthRequired") return null;
  if (state.reason === "replaced") return state.message ?? REPLACED_MESSAGE;
  return EXPIRED_MESSAGE;
}
