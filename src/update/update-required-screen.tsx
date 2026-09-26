import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { Wordmark } from "@/components/wordmark";
import { env } from "@/config/env";
import { layoutSpacing, maxContentWidth, spacing, useThemeColors } from "@/theme";

// Shown instead of the whole app once the backend has turned this build away.
// There is nothing to retry: every request would get the same answer.
export function UpdateRequiredScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.backgroundCanvas, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <Wordmark size="lg" />
        <View style={styles.copy}>
          <AppText variant="headline" accessibilityRole="header">
            Time to update DevHub
          </AppText>
          <AppText tone="secondary">
            This version of the app is no longer supported. Install the latest version to keep using DevHub. Your
            account and messages will be right where you left them.
          </AppText>
        </View>
        <Button label="Download the update" icon="forward" onPress={() => void Linking.openURL(env.updateUrl)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: layoutSpacing.screenX,
  },
  content: {
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    gap: spacing.xl,
  },
  copy: {
    gap: spacing.sm,
  },
});
