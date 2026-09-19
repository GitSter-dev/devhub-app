import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { componentRadius, continuous, spacing, useThemeColors } from "@/theme";

export function TerminalCard({ children }: { children: ReactNode }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, continuous, { backgroundColor: colors.codeBackground, borderColor: colors.codeBorder }]}>
      <View style={[styles.bar, { borderBottomColor: colors.codeBorder }]}>
        {[colors.dangerSolid, colors.warningSolid, colors.successSolid].map((dot) => (
          <View key={dot} style={[styles.dot, { backgroundColor: dot }]} />
        ))}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: componentRadius.card,
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
});
