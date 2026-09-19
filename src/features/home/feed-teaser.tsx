import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { BlinkingCursor } from "@/components/blinking-cursor";
import { TerminalCard } from "@/components/terminal-card";
import { spacing } from "@/theme";

export function FeedTeaser() {
  return (
    <View style={styles.section}>
      <AppText variant="overline" tone="accent" uppercase>
        Your feed
      </AppText>
      <AppText variant="title3">Almost here</AppText>
      <AppText variant="callout" tone="secondary">
        {"Posts, topics and people to follow are landing next. You're one of the first builders here."}
      </AppText>

      <TerminalCard>
        <AppText variant="code" tone="secondary">
          <AppText variant="code" tone="accent">$</AppText> devhub feed --follow
        </AppText>
        <AppText variant="code" tone="tertiary">› compiling your timeline…</AppText>
        <View style={styles.prompt}>
          <AppText variant="code" tone="accent">$</AppText>
          <BlinkingCursor />
        </View>
      </TerminalCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
