import { Stack } from "expo-router";
import { View } from "react-native";

import { AuthBackdrop } from "@/features/auth/auth-backdrop";
import { useThemeColors } from "@/theme";

export const unstable_settings = { anchor: "log-in" };

export default function AuthLayout() {
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundCanvas }}>
      <AuthBackdrop />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
        <Stack.Screen name="log-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </View>
  );
}
