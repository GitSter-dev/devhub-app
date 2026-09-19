import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { toApiError } from "@/api/api-error";
import { completeSetup } from "@/api/users-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { TerminalCard } from "@/components/terminal-card";
import { haptics } from "@/feedback/haptics";
import { followSync, useFollowing } from "@/features/follows/follow-sync";
import { SetupScaffold } from "@/features/setup/setup-scaffold";
import { SuggestionRow } from "@/features/setup/suggestion-row";
import { useSuggestions } from "@/features/setup/use-setup-queries";
import { sessionManager } from "@/session/session-manager";
import { currentUserQueryKey } from "@/session/use-session";
import { rememberSetupCompleted } from "@/setup/setup-status";
import { layoutSpacing, spacing, useThemeColors } from "@/theme";

export default function PeopleScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const suggestions = useSuggestions();
  const following = useFollowing();
  const followingCount = [...following.values()].filter(Boolean).length;

  const finish = useMutation({
    mutationFn: () => completeSetup(sessionManager.client),
    onSuccess: (user) => {
      haptics.success();
      rememberSetupCompleted();
      queryClient.setQueryData(currentUserQueryKey, user);
    },
    onError: () => haptics.error(),
  });

  return (
    <SetupScaffold
      step={2}
      title="People to follow"
      subtitle="Developers who build with the same stack. Follow a few to fill your feed."
      footer={
        <View style={styles.footer}>
          {finish.error && <FormBanner tone="error" message={toApiError(finish.error).message} />}
          <Button
            label={followingCount > 0 ? "Continue" : "Skip for now"}
            variant={followingCount > 0 ? "primary" : "secondary"}
            icon="forward"
            loading={finish.isPending}
            onPress={() => finish.mutate()}
          />
        </View>
      }
    >
      {suggestions.error ? (
        <View style={styles.list}>
          <FormBanner tone="error" message={toApiError(suggestions.error).message} />
          <Button label="Try again" variant="secondary" onPress={() => void suggestions.refetch()} />
        </View>
      ) : !suggestions.data ? (
        <ActivityIndicator style={styles.loading} color={colors.accent} />
      ) : suggestions.data.length === 0 ? (
        <TerminalCard>
          <AppText variant="code" tone="accent">
            $ devhub people --suggest
          </AppText>
          <AppText variant="code" tone="secondary">
            {"> you're one of the first builders here"}
          </AppText>
          <AppText variant="code" tone="secondary">
            {"> we'll suggest people as the community grows"}
          </AppText>
        </TerminalCard>
      ) : (
        <View style={styles.list}>
          {suggestions.data.map((suggestion) => (
            <SuggestionRow
              key={suggestion.user.id}
              suggestion={suggestion}
              following={following.get(suggestion.user.id) ?? false}
              onToggle={() => {
                haptics.selection();
                followSync.toggle(suggestion.user.id);
              }}
            />
          ))}
        </View>
      )}
    </SetupScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: layoutSpacing.listGap,
  },
  footer: {
    gap: spacing.md,
  },
  loading: {
    marginTop: spacing.xl,
  },
});
