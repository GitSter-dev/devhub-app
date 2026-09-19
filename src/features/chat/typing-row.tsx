import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { useTypists } from "@/chat/typing";
import { layoutSpacing, spacing } from "@/theme";

function sentence(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return "Several people are typing…";
}

export function TypingRow({ conversationId }: { conversationId: string }) {
  const names = useTypists(conversationId);
  if (names.length === 0) return null;
  return (
    <View style={styles.row} accessibilityLiveRegion="polite">
      <AppText variant="footnote" tone="accent">
        {sentence(names)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: layoutSpacing.screenX,
    paddingVertical: spacing.xs,
  },
});
