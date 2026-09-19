import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { toApiError } from "@/api/api-error";
import { changeUsername, checkUsername } from "@/api/profiles-api";
import type { CurrentUser } from "@/api/users-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { KeyboardScreen } from "@/components/keyboard-screen";
import { ScreenHeader } from "@/components/screen-header";
import { haptics } from "@/feedback/haptics";
import { applyServerFieldErrors } from "@/features/auth/apply-server-errors";
import { profileKeys } from "@/features/profile/profile-queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usernameSchema, type UsernameInput, type UsernameValues } from "@/schemas/usernameSchema";
import { sessionManager } from "@/session/session-manager";
import { currentUserQueryKey, useCurrentUser } from "@/session/use-session";
import { spacing } from "@/theme";

const CHECK_DEBOUNCE_MS = 400;
const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function ChangeUsernameScreen() {
  const me = useCurrentUser().data;

  return (
    <KeyboardScreen>
      <View style={styles.page}>
        <ScreenHeader title="Username" />
        {me && <ChangeUsernameForm me={me} />}
      </View>
    </KeyboardScreen>
  );
}

function ChangeUsernameForm({ me }: { me: CurrentUser }) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, setError } = useForm<UsernameInput, unknown, UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: me.username },
  });
  const typed = useWatch({ control, name: "username" }).trim();
  const candidate = useDebouncedValue(typed, CHECK_DEBOUNCE_MS);
  const unchanged = candidate === me.username;
  const valid = usernameSchema.safeParse({ username: candidate }).success;
  const availability = useQuery({
    queryKey: ["users", "username-availability", candidate.toLowerCase()],
    queryFn: () => checkUsername(sessionManager.client, candidate),
    enabled: valid && !unchanged,
  });
  const lockedUntil = me.usernameChangeAvailableAt ? new Date(me.usernameChangeAvailableAt) : null;

  const save = useMutation({
    mutationFn: ({ username }: UsernameValues) => changeUsername(sessionManager.client, username),
    onSuccess: (user) => {
      haptics.success();
      queryClient.setQueryData(currentUserQueryKey, user);
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
      router.back();
    },
    onError: (error) => {
      haptics.error();
      applyServerFieldErrors(toApiError(error), setError, ["username"], { USERNAME_TAKEN: "username" });
    },
  });

  const bannerError =
    save.error && toApiError(save.error).code !== "USERNAME_TAKEN" ? toApiError(save.error).message : null;
  const status =
    typed !== candidate || unchanged || !valid
      ? null
      : availability.data?.available
        ? { tone: "success" as const, text: `@${candidate} is available` }
        : availability.data?.reason === "TAKEN"
          ? { tone: "danger" as const, text: `@${candidate} is taken` }
          : null;

  return (
    <View style={styles.form}>
      <AppText variant="body" tone="secondary">
        You can change your username once every 30 days. Your old one is held for you for 14 days: nobody else can
        take it, links to it keep working, and you can switch back.
      </AppText>
      {lockedUntil && <FormBanner tone="info" message={`You can change it again after ${dateFormat.format(lockedUntil)}.`} />}
      {bannerError && <FormBanner tone="error" message={bannerError} />}
      <FormTextField
        control={control}
        name="username"
        label="Username"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        mono
        editable={!lockedUntil}
      />
      {status && (
        <AppText variant="footnote" tone={status.tone}>
          {status.text}
        </AppText>
      )}
      <Button
        label="Change username"
        disabled={Boolean(lockedUntil) || typed === me.username || availability.data?.available === false}
        loading={save.isPending}
        onPress={handleSubmit((values) => save.mutate(values))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
});
