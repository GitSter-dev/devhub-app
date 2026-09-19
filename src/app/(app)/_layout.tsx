import { Stack } from "expo-router";

import { ChatEffects } from "@/chat/chat-effects";
import { NotificationEffects } from "@/notifications/notification-effects";
import { NotificationTapEffects } from "@/push/notification-taps";
import { PushEffects } from "@/push/push-effects";
import { RealtimeEffects } from "@/realtime/realtime-effects";

export default function AppLayout() {
  return (
    <>
      <PushEffects />
      <RealtimeEffects />
      <ChatEffects />
      <NotificationEffects />
      <NotificationTapEffects />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="compose" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
