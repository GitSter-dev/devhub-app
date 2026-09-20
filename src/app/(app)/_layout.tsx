import { Stack } from "expo-router";

import { ChatEffects } from "@/chat/chat-effects";
import { ActionSheetHost } from "@/components/action-sheet-host";
import { NotificationEffects } from "@/notifications/notification-effects";
import { ReportSheet } from "@/moderation/report-sheet";
import { NotificationTapEffects } from "@/push/notification-taps";
import { PushEffects } from "@/push/push-effects";
import { RealtimeEffects } from "@/realtime/realtime-effects";

export const unstable_settings = { anchor: "(tabs)" };

export default function AppLayout() {
  return (
    <>
      <PushEffects />
      <RealtimeEffects />
      <ChatEffects />
      <NotificationEffects />
      <NotificationTapEffects />
      <ActionSheetHost />
      <ReportSheet />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="compose" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
