import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { openConversation } from "@/chat/open-conversation";

export const ACTIVITY_CHANNEL_ID = "activity";

export function presentNotificationsInForeground(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as { kind?: string; conversationId?: string } | undefined;
      const inOpenChat = data?.kind === "chat" && data.conversationId === openConversation.get();
      return {
        shouldShowBanner: !inOpenChat,
        shouldShowList: !inOpenChat,
        shouldPlaySound: !inOpenChat,
        shouldSetBadge: false,
      };
    },
  });
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ACTIVITY_CHANNEL_ID, {
    name: "Activity",
    description: "Replies, mentions and follows",
    importance: Notifications.AndroidImportance.HIGH,
  });
}
