// Per-variant subpaths, not the package index: the index re-exports all 18 Inter
// and 16 JetBrains Mono files, and Metro bundles every one it can see. Importing
// the six we actually use keeps ~3.5MB of unused faces out of the app.
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/api/query-client";
import { useHasSeenOnboarding } from "@/onboarding/onboarding-store";
import { SessionEffects } from "@/session/session-effects";
import { useSessionState } from "@/session/use-session";
import { navigationTheme, ThemeProvider, useColorScheme } from "@/theme";

// Hold the splash until the type ramp is real. Showing Inter's metrics with the
// system face substituted, then swapping, is worse than a beat of splash.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden, or unsupported — nothing to do.
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SessionEffects />
            {fontsReady && <ThemedNavigation />}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedNavigation() {
  const scheme = useColorScheme();
  const session = useSessionState();
  const seenOnboarding = useHasSeenOnboarding();
  const hydrated = session.status !== "hydrating";
  const signedIn = session.status === "signedIn";

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <NavigationThemeProvider value={navigationTheme(scheme)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!signedIn && !seenOnboarding}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Screen name="design-system" />
      </Stack>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}
