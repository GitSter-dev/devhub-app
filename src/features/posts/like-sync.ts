import { likePost, unlikePost } from "@/api/posts-api";
import { sessionManager } from "@/session/session-manager";
import { useStore } from "@/state/create-store";
import { ToggleSync } from "@/state/toggle-sync";

export const likeSync = new ToggleSync({
  turnOn: (postId) => likePost(sessionManager.client, postId),
  turnOff: (postId) => unlikePost(sessionManager.client, postId),
});

export function useLikes(): ReadonlyMap<string, boolean> {
  return useStore(likeSync.store);
}
