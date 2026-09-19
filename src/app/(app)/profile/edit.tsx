import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { toApiError } from "@/api/api-error";
import { updateMyProfile, type Profile } from "@/api/profiles-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { Icon } from "@/components/icon";
import { KeyboardScreen } from "@/components/keyboard-screen";
import { ScreenHeader } from "@/components/screen-header";
import { haptics } from "@/feedback/haptics";
import { applyServerFieldErrors } from "@/features/auth/apply-server-errors";
import { profileKeys, useProfile } from "@/features/profile/profile-queries";
import { profileSchema, type ProfileInput, type ProfileValues } from "@/schemas/profileSchema";
import { sessionManager } from "@/session/session-manager";
import { currentUserQueryKey, useCurrentUser } from "@/session/use-session";
import { componentRadius, minTouchTarget, spacing, useThemeColors } from "@/theme";

const FIELDS = ["displayName", "bio", "githubUsername", "websiteUrl"] as const;

export default function EditProfileScreen() {
  const colors = useThemeColors();
  const me = useCurrentUser().data;
  const profile = useProfile(me?.username ?? "");

  return (
    <KeyboardScreen>
      <View style={styles.page}>
        <ScreenHeader title="Edit profile" />
        {me && profile.data ? (
          <EditProfileForm profile={profile.data} />
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    </KeyboardScreen>
  );
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { control, handleSubmit, setError } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.displayName,
      bio: profile.bio ?? "",
      githubUsername: profile.githubUsername ?? "",
      websiteUrl: profile.websiteUrl ?? "",
    },
  });

  const save = useMutation({
    mutationFn: (values: ProfileValues) => updateMyProfile(sessionManager.client, values),
    onSuccess: (updated) => {
      haptics.success();
      queryClient.setQueryData(profileKeys.profile(updated.username), updated);
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      router.back();
    },
    onError: (error) => {
      haptics.error();
      applyServerFieldErrors(toApiError(error), setError, FIELDS);
    },
  });

  const serverError = save.error && Object.keys(toApiError(save.error).fieldErrors).length === 0 ? toApiError(save.error) : null;

  return (
    <View style={styles.form}>
      {serverError && <FormBanner tone="error" message={serverError.message} />}
      <FormTextField control={control} name="displayName" label="Display name" autoCapitalize="words" maxLength={50} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Username @${profile.username}. Change username`}
        onPress={() => router.push("/profile/username")}
        style={[styles.usernameRow, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
      >
        <View style={styles.usernameText}>
          <AppText variant="footnote" tone="tertiary">
            Username
          </AppText>
          <AppText variant="handle">@{profile.username}</AppText>
        </View>
        <Icon name="forward" color={colors.textTertiary} size="sm" />
      </Pressable>
      <FormTextField control={control} name="bio" label="Bio" hint="Up to 160 characters" multiline maxLength={160} />
      <FormTextField
        control={control}
        name="githubUsername"
        label="GitHub username"
        hint="Just the username, like octocat"
        autoCapitalize="none"
        autoCorrect={false}
        mono
      />
      <FormTextField
        control={control}
        name="websiteUrl"
        label="Website"
        placeholder="https://"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Button label="Save" loading={save.isPending} onPress={handleSubmit((values) => save.mutate(values))} />
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
  usernameRow: {
    minHeight: minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: componentRadius.input,
    borderWidth: 1,
  },
  usernameText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
