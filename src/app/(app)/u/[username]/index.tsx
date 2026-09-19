import { router, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";

import { chatApi } from "@/api/chat-api";
import { chatStore } from "@/chat/chat-store";
import { ProfileView } from "@/features/profile/profile-view";
import { sessionManager } from "@/session/session-manager";

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <ProfileView
      username={username}
      onOpenList={(list) =>
        router.push({ pathname: list === "followers" ? "/u/[username]/followers" : "/u/[username]/following", params: { username } })
      }
      onEditProfile={() => router.push("/profile/edit")}
      onEditStack={() => router.push("/profile/stack")}
      onMessage={(userId) =>
        void chatApi
          .openDirect(sessionManager.client, userId)
          .then(async (conversation) => {
            await chatStore.saveConversations([conversation]);
            router.push({ pathname: "/messages/[id]", params: { id: conversation.id } });
          })
          .catch(() => Alert.alert("Couldn't open the conversation", "Check your connection and try again."))
      }
      showPosts
    />
  );
}
