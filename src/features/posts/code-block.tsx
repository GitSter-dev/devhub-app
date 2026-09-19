import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { componentRadius, continuous, spacing, useThemeColors } from "@/theme";

export function CodeBlock({ code, language }: { code: string; language: string | null }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.block, continuous, { backgroundColor: colors.codeBackground, borderColor: colors.codeBorder }]}>
      {language && (
        <View style={[styles.header, { borderBottomColor: colors.codeBorder }]}>
          <AppText variant="caption" tone="tertiary">
            {language}
          </AppText>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <AppText variant="code" selectable>
          {code}
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderRadius: componentRadius.card,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    padding: spacing.md,
  },
});
