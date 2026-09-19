import { Stack } from "expo-router";

import { useThemeColors } from "@/theme";

export const unstable_settings = { anchor: "stack" };

export default function SetupLayout() {
  const colors = useThemeColors();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.backgroundCanvas } }}>
      <Stack.Screen name="stack" />
      <Stack.Screen name="people" />
      <Stack.Screen name="person/[username]" />
    </Stack>
  );
}
