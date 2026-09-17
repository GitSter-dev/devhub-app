// Per-variant subpaths, not the package index: the index re-exports all 18 Inter
// and 16 JetBrains Mono files, and Metro bundles every one it can see. Importing
// the six we actually use keeps ~3.5MB of unused faces out of the app.
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import { useFonts } from "expo-font";
import { Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

  useEffect(() => {
    // Hide on error too, rather than stranding the user on the splash screen —
    // the app still works with the fallback face.
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedNavigation />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Split out because it reads the theme, which only exists below <ThemeProvider>.
 * The preference is read synchronously at provider init, so there's no second
 * gate here — the first frame is already in the right scheme.
 */
function ThemedNavigation() {
  const scheme = useColorScheme();

  return (
    <NavigationThemeProvider value={navigationTheme(scheme)}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}
