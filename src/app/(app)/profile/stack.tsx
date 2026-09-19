import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { toApiError } from "@/api/api-error";
import { saveMyTopics } from "@/api/topics-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { KeyboardScreen } from "@/components/keyboard-screen";
import { ScreenHeader } from "@/components/screen-header";
import { haptics } from "@/feedback/haptics";
import { profileKeys } from "@/features/profile/profile-queries";
import { setupQueryKeys, useMyTopics, useTopics } from "@/features/setup/use-setup-queries";
import { MAX_TOPICS, TopicPicker } from "@/features/topics/topic-picker";
import { sessionManager } from "@/session/session-manager";
import { spacing, useThemeColors } from "@/theme";

export default function EditStackScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const topics = useTopics();
  const myTopics = useMyTopics();
  const [picked, setPicked] = useState<ReadonlySet<string> | null>(null);
  const selected = picked ?? new Set(myTopics.data ?? []);

  const save = useMutation({
    mutationFn: (slugs: string[]) => saveMyTopics(sessionManager.client, slugs),
    onSuccess: (slugs) => {
      haptics.success();
      queryClient.setQueryData(setupQueryKeys.myTopics, slugs);
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
      void queryClient.invalidateQueries({ queryKey: setupQueryKeys.suggestions });
      router.back();
    },
    onError: () => haptics.error(),
  });

  const loadError = topics.error ?? myTopics.error;

  return (
    <KeyboardScreen>
      <View style={styles.page}>
        <ScreenHeader title="Your stack" />
        {loadError ? (
          <FormBanner tone="error" message={toApiError(loadError).message} />
        ) : !topics.data || myTopics.isPending ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <TopicPicker topics={topics.data} selected={selected} onChange={setPicked} />
        )}
        {save.error && <FormBanner tone="error" message={toApiError(save.error).message} />}
        <AppText variant="metric" tone={selected.size >= MAX_TOPICS ? "warning" : "tertiary"} center>
          {selected.size} of {MAX_TOPICS} selected
        </AppText>
        <Button
          label="Save"
          disabled={selected.size === 0}
          loading={save.isPending}
          onPress={() => save.mutate([...selected])}
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.xl,
  },
});
