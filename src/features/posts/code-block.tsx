import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { componentRadius, continuous, spacing, useThemeColors } from "@/theme";

type CodeBlockProps = {
  code: string;
  language: string | null;
  selectable?: boolean;
};

export function CodeBlock({ code, language, selectable = true }: CodeBlockProps) {
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller} contentContainerStyle={styles.scroll}>
        <AppText variant="code" selectable={selectable}>
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
  scroller: {
    flexGrow: 0,
  },
  scroll: {
    padding: spacing.md,
  },
});
