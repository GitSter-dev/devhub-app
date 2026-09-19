import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { TopicChip } from "@/components/topic-chip";
import { haptics } from "@/feedback/haptics";
import { spacing } from "@/theme";

const TOPICS = [
  "react-native",
  "typescript",
  "ai",
  "rust",
  "design",
  "devops",
  "kotlin",
  "open-source",
  "databases",
  "go",
  "security",
  "game-dev",
];

export function TopicsSlide() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(["react-native", "rust"]));

  const toggle = (name: string) => {
    haptics.selection();
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {TOPICS.map((name) => (
          <TopicChip key={name} slug={name} selected={selected.has(name)} onPress={() => toggle(name)} />
        ))}
      </View>
      <AppText variant="metric" tone="accent" center>
        {selected.size} {selected.size === 1 ? "topic" : "topics"} selected · tap to try it
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
