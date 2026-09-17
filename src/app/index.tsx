import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  componentRadius,
  continuous,
  layoutSpacing,
  maxContentWidth,
  minTouchTarget,
  spacing,
  type,
  useTheme,
} from "@/theme";

export default function Index() {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.backgroundCanvas, paddingTop: insets.top },
      ]}
    >
      <View style={styles.column}>
        <Text style={[type.overline, styles.uppercase, { color: colors.accent }]}>DevHub</Text>
        <Text style={[type.title1, { color: colors.textPrimary, marginTop: spacing.xs }]}>
          Where builders talk shop
        </Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
          The design system is in place. Screens come next — start them from `@/theme` and they
          will already be themed, in both schemes.
        </Text>

        <Link href="/design-system" asChild>
          {/*
            Link clones its child, so that child gets a single flattened style —
            an array here trips expo-router's <Slot> warning.
          */}
          <Pressable
            accessibilityRole="button"
            style={StyleSheet.flatten([
              styles.cta,
              continuous,
              { backgroundColor: colors.accentSolid, boxShadow: shadows.accent },
            ])}
          >
            <Text style={[type.subhead, { color: colors.onAccentSolid }]}>
              View design tokens
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: layoutSpacing.screenX,
  },
  column: {
    width: "100%",
    maxWidth: maxContentWidth,
  },
  uppercase: {
    textTransform: "uppercase",
  },
  cta: {
    marginTop: layoutSpacing.sectionGap,
    alignSelf: "flex-start",
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: componentRadius.button,
  },
});
