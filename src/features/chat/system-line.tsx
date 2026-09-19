import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { componentRadius, spacing, useThemeColors } from "@/theme";

export function SystemLine({ text }: { text: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <View style={[styles.pill, { backgroundColor: colors.backgroundSunken }]}>
        <AppText variant="caption" tone="tertiary" center>
          {text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: componentRadius.chip,
  },
});
