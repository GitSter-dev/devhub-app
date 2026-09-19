import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { presentNotificationsInForeground } from "./notification-setup";
import { isPushSupported, registerCurrentDevice, syncPushRegistration } from "./push-registration";

export function PushEffects() {
  useEffect(() => {
    presentNotificationsInForeground();
    void syncPushRegistration();
  }, []);

  useEffect(() => {
    if (!isPushSupported()) return;
    const subscription = Notifications.addPushTokenListener((token) => {
      void registerCurrentDevice(String(token.data));
    });
    return () => subscription.remove();
  }, []);

  return null;
}
