import { StyleSheet, View } from "react-native";

import type { Topic } from "@/api/topics-api";
import { TopicChip } from "@/components/topic-chip";
import { haptics } from "@/feedback/haptics";
import { spacing } from "@/theme";

export const MAX_TOPICS = 10;

type TopicPickerProps = {
  topics: readonly Topic[];
  selected: ReadonlySet<string>;
  onChange: (selected: ReadonlySet<string>) => void;
};

export function TopicPicker({ topics, selected, onChange }: TopicPickerProps) {
  const full = selected.size >= MAX_TOPICS;

  const toggle = (slug: string) => {
    haptics.selection();
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange(next);
  };

  return (
    <View style={styles.chips}>
      {topics.map((topic) => (
        <TopicChip
          key={topic.slug}
          slug={topic.slug}
          selected={selected.has(topic.slug)}
          disabled={full && !selected.has(topic.slug)}
          onPress={() => toggle(topic.slug)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
