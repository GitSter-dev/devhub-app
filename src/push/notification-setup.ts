import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const ACTIVITY_CHANNEL_ID = "activity";

export function presentNotificationsInForeground(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
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
