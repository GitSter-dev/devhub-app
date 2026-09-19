import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

import { openNotification, targetFromPush } from "@/features/notifications/notification-route";

function open(data: Record<string, unknown> | undefined): void {
  if (!data) return;
  if (data.kind === "chat" && typeof data.conversationId === "string") {
    router.push({ pathname: "/messages/[id]", params: { id: data.conversationId } });
    return;
  }
  if (data.kind === "activity") {
    const target = targetFromPush(data);
    if (target) openNotification(target);
  }
}

export function NotificationTapEffects() {
  useEffect(() => {
    const handled = new Set<string>();
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response || handled.has(response.notification.request.identifier)) return;
      handled.add(response.notification.request.identifier);
      open(response.notification.request.content.data);
    };
    void Notifications.getLastNotificationResponseAsync().then(handle);
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, []);

  return null;
}
