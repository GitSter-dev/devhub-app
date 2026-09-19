import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";

import { accountApi } from "@/api/account-api";
import { toApiError } from "@/api/api-error";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { KeyboardScreen } from "@/components/keyboard-screen";
import { ScreenHeader } from "@/components/screen-header";
import { haptics } from "@/feedback/haptics";
import { deleteAccountSchema, type DeleteAccountInput, type DeleteAccountValues } from "@/schemas/deleteAccountSchema";
import { sessionManager } from "@/session/session-manager";
import { spacing } from "@/theme";

const WHAT_HAPPENS = [
  "You're signed out on every device straight away.",
  "Your profile, posts and messages stop being visible to everyone else.",
  "Sign in within 30 days and everything comes back.",
  "After 30 days it's erased for good: your posts and messages lose their content, your follows, likes and notifications go, and your profile becomes a deleted user.",
  "Your username stays reserved afterwards, so nobody can take it and pretend to be you.",
];

export default function DeleteAccountScreen() {
  const { control, handleSubmit } = useForm<DeleteAccountInput, unknown, DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "" },
    mode: "onTouched",
  });

  const remove = useMutation({
    mutationFn: (values: DeleteAccountValues) => accountApi.requestDeletion(sessionManager.client, values.password),
    onSuccess: async () => {
      haptics.success();
      await sessionManager.signOut("account deleted");
      Alert.alert("Account scheduled for deletion", "Sign in within 30 days if you change your mind.");
    },
    onError: () => haptics.error(),
  });

  const confirm = handleSubmit((values) =>
    Alert.alert("Delete your account?", "You have 30 days to change your mind before it is erased.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate(values) },
    ]),
  );

  return (
    <KeyboardScreen>
      <View style={styles.page}>
        <ScreenHeader title="Delete account" />
        <View style={styles.list}>
          {WHAT_HAPPENS.map((line) => (
            <AppText key={line} variant="body" tone="secondary">
              {"•  "}
              {line}
            </AppText>
          ))}
        </View>
        {remove.error && <FormBanner tone="error" message={toApiError(remove.error).message} />}
        <FormTextField control={control} name="password" label="Your password" secure autoCapitalize="none" />
        <Button label="Delete my account" variant="danger" loading={remove.isPending} onPress={confirm} />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
});
