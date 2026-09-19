import { followUser, unfollowUser } from "@/api/follows-api";
import { sessionManager } from "@/session/session-manager";
import { useStore } from "@/state/create-store";
import { ToggleSync } from "@/state/toggle-sync";

export const followSync = new ToggleSync({
  turnOn: (userId) => followUser(sessionManager.client, userId),
  turnOff: (userId) => unfollowUser(sessionManager.client, userId),
});

export function useFollowing(): ReadonlyMap<string, boolean> {
  return useStore(followSync.store);
}
