import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import { deletePost } from "@/api/posts-api";
import { haptics } from "@/feedback/haptics";
import { sessionManager } from "@/session/session-manager";

import { postKeys } from "./post-queries";

export function useDeletePost(): (postId: string) => void {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (postId: string) => deletePost(sessionManager.client, postId),
    onSuccess: () => {
      haptics.success();
      void queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
    onError: () => {
      haptics.error();
      Alert.alert("Couldn't delete the post", "Check your connection and try again.");
    },
  });

  return (postId) =>
    Alert.alert("Delete post?", "Replies stay in the thread, but your post's content is removed for good.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate(postId) },
    ]);
}
