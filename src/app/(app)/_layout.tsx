import { Stack } from "expo-router";

import { PushEffects } from "@/push/push-effects";
import { RealtimeEffects } from "@/realtime/realtime-effects";

export default function AppLayout() {
  return (
    <>
      <PushEffects />
      <RealtimeEffects />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="compose" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
