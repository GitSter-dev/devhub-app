import { useEffect } from "react";
import { AppState } from "react-native";

import { refreshNotifications } from "@/features/notifications/notification-queries";
import { realtimeEvents } from "@/realtime/realtime-events";

export function NotificationEffects() {
  useEffect(() => {
    const unsubscribeEvents = realtimeEvents.subscribe((event) => {
      if (event.type === "NOTIFICATIONS_CHANGED") refreshNotifications();
    });
    const unsubscribeResync = realtimeEvents.onResync(refreshNotifications);
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") refreshNotifications();
    });
    return () => {
      unsubscribeEvents();
      unsubscribeResync();
      appState.remove();
    };
  }, []);

  return null;
}
