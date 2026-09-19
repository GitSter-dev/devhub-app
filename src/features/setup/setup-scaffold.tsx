import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { borderWidth, layoutSpacing, maxContentWidth, radius, spacing, useThemeColors } from "@/theme";

const STEP_COUNT = 2;

type SetupScaffoldProps = {
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function SetupScaffold({ step, title, subtitle, children, footer }: SetupScaffoldProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          <View style={styles.header}>
            <View style={styles.progress} accessibilityLabel={`Step ${step} of ${STEP_COUNT}`}>
              {Array.from({ length: STEP_COUNT }, (_, index) => (
                <View
                  key={index}
                  style={[styles.segment, { backgroundColor: index < step ? colors.accentSolid : colors.borderStrong }]}
                />
              ))}
            </View>
            <AppText variant="overline" tone="accent" uppercase>
              Step {step} of {STEP_COUNT}
            </AppText>
            <AppText variant="title1" accessibilityRole="header">
              {title}
            </AppText>
            <AppText variant="body" tone="secondary">
              {subtitle}
            </AppText>
          </View>
          {children}
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.backgroundCanvas,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.column}>{footer}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: layoutSpacing.screenX,
    paddingBottom: spacing.xl,
  },
  column: {
    width: "100%",
    maxWidth: maxContentWidth,
    gap: layoutSpacing.sectionGap,
  },
  header: {
    gap: spacing.sm,
  },
  progress: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    height: spacing.xs,
    borderRadius: radius.full,
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingHorizontal: layoutSpacing.screenX,
    borderTopWidth: borderWidth.hairline,
  },
});
