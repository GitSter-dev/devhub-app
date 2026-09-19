import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { toApiError } from "@/api/api-error";
import { saveMyTopics } from "@/api/topics-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { TopicChip } from "@/components/topic-chip";
import { haptics } from "@/feedback/haptics";
import { SetupScaffold } from "@/features/setup/setup-scaffold";
import { setupQueryKeys, useMyTopics, useTopics } from "@/features/setup/use-setup-queries";
import { sessionManager } from "@/session/session-manager";
import { spacing, useThemeColors } from "@/theme";

const MAX_TOPICS = 10;

export default function StackScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const topics = useTopics();
  const myTopics = useMyTopics();
  const [picked, setPicked] = useState<ReadonlySet<string> | null>(null);
  const selected = picked ?? new Set(myTopics.data ?? []);

  const save = useMutation({
    mutationFn: (slugs: string[]) => saveMyTopics(sessionManager.client, slugs),
    onSuccess: (slugs) => {
      queryClient.setQueryData(setupQueryKeys.myTopics, slugs);
      void queryClient.invalidateQueries({ queryKey: setupQueryKeys.suggestions });
      haptics.success();
      router.push("/people");
    },
    onError: () => haptics.error(),
  });

  const toggle = (slug: string) => {
    haptics.selection();
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setPicked(next);
  };

  const full = selected.size >= MAX_TOPICS;
  const loadError = topics.error ?? myTopics.error;

  return (
    <SetupScaffold
      step={1}
      title="Pick your stack"
      subtitle="Choose what you build with. We use it to find developers worth following."
      footer={
        <View style={styles.footer}>
          {save.error && <FormBanner tone="error" message={toApiError(save.error).message} />}
          <AppText variant="metric" tone={full ? "warning" : "tertiary"} center>
            {selected.size} of {MAX_TOPICS} selected
          </AppText>
          <Button
            label="Continue"
            icon="forward"
            disabled={selected.size === 0}
            loading={save.isPending}
            onPress={() => save.mutate([...selected])}
          />
        </View>
      }
    >
      {loadError ? (
        <View style={styles.state}>
          <FormBanner tone="error" message={toApiError(loadError).message} />
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => {
              void topics.refetch();
              void myTopics.refetch();
            }}
          />
        </View>
      ) : !topics.data || myTopics.isPending ? (
        <ActivityIndicator style={styles.loading} color={colors.accent} />
      ) : (
        <View style={styles.chips}>
          {topics.data.map((topic) => (
            <TopicChip
              key={topic.slug}
              slug={topic.slug}
              selected={selected.has(topic.slug)}
              disabled={full && !selected.has(topic.slug)}
              onPress={() => toggle(topic.slug)}
            />
          ))}
        </View>
      )}
    </SetupScaffold>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.md,
  },
  state: {
    gap: spacing.md,
  },
  loading: {
    marginTop: spacing.xl,
  },
});
