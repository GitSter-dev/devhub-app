import { Alert } from "react-native";

import { toApiError } from "@/api/api-error";
import { blocksApi } from "@/api/blocks-api";
import { queryClient } from "@/api/query-client";
import { haptics } from "@/feedback/haptics";
import { followSync } from "@/features/follows/follow-sync";
import { sessionManager } from "@/session/session-manager";

export function confirmBlock(userId: string, username: string, onBlocked?: () => void): void {
  Alert.alert(
    `Block @${username}?`,
    "You won't see each other's posts, profiles or messages, and you'll both stop following each other.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () => {
          void blocksApi
            .block(sessionManager.client, userId)
            .then(async () => {
              haptics.success();
              followSync.forget(userId);
              await queryClient.invalidateQueries();
              onBlocked?.();
            })
            .catch((error: unknown) => {
              haptics.error();
              Alert.alert("Couldn't block", toApiError(error).message);
            });
        },
      },
    ],
  );
}

export function unblock(userId: string): Promise<void> {
  return blocksApi.unblock(sessionManager.client, userId).then(async () => {
    followSync.forget(userId);
    await queryClient.invalidateQueries();
  });
}
