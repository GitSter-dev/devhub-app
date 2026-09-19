import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { Icon, type IconName } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { sessionManager } from "@/session/session-manager";
import { componentRadius, continuous, layoutSpacing, maxContentWidth, minTouchTarget, spacing, useThemeColors } from "@/theme";

type Row = {
  label: string;
  hint: string;
  icon: IconName;
  danger?: boolean;
  onPress: () => void;
};

export default function SettingsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const rows: Row[] = [
    {
      label: "Blocked people",
      hint: "See who you blocked and unblock them",
      icon: "person",
      onPress: () => router.push("/settings/blocked"),
    },
    {
      label: "Sign out",
      hint: "Sign out on this device",
      icon: "logout",
      onPress: () =>
        Alert.alert("Sign out?", "You can sign back in any time.", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign out", style: "destructive", onPress: () => void sessionManager.signOut() },
        ]),
    },
    {
      label: "Delete account",
      hint: "Remove your account and everything on it",
      icon: "error",
      danger: true,
      onPress: () => router.push("/settings/delete-account"),
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundCanvas }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <ScreenHeader title="Settings" />
      <View style={styles.rows}>
        {rows.map((row) => (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.row,
              continuous,
              { backgroundColor: pressed ? colors.backgroundSunken : colors.backgroundSurface, borderColor: colors.border },
            ]}
          >
            <Icon name={row.icon} color={row.danger ? colors.danger : colors.textSecondary} size="sm" />
            <View style={styles.rowText}>
              <AppText variant="body" tone={row.danger ? "danger" : "primary"}>
                {row.label}
              </AppText>
              <AppText variant="footnote" tone="tertiary">
                {row.hint}
              </AppText>
            </View>
            <Icon name="forward" color={colors.textTertiary} size="sm" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layoutSpacing.screenX,
    gap: layoutSpacing.sectionGap,
  },
  rows: {
    gap: layoutSpacing.listGap,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: minTouchTarget + spacing.md,
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
