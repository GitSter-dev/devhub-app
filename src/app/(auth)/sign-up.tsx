import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";

import { toApiError, type ApiError } from "@/api/api-error";
import { authApi } from "@/api/auth-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { TextLink } from "@/components/text-link";
import { applyServerFieldErrors } from "@/features/auth/apply-server-errors";
import { AuthScaffold } from "@/features/auth/auth-scaffold";
import { haptics } from "@/feedback/haptics";
import { userSignupSchema, type UserSignupInput, type UserSignupValues } from "@/schemas/userSignupSchema";
import { clearAuthNotice } from "@/session/auth-notice";
import { pendingCredentials } from "@/session/pending-credentials";
import { useIdempotencyKey } from "@/session/use-idempotency-key";
import { spacing } from "@/theme";

const FIELDS = ["username", "displayName", "email", "password"] as const;

export default function SignUpScreen() {
  const [failure, setFailure] = useState<ApiError | null>(null);

  const { control, handleSubmit, setError } = useForm<UserSignupInput, unknown, UserSignupValues>({
    resolver: zodResolver(userSignupSchema),
    defaultValues: { username: "", displayName: "", email: "", password: "" },
    mode: "onTouched",
  });
  const { keyFor, rotate } = useIdempotencyKey();

  const signup = useMutation({
    mutationFn: (account: UserSignupValues) => authApi.signup(account, keyFor(account)),
    onSuccess: (_, account) => {
      rotate();
      clearAuthNotice();
      haptics.success();
      pendingCredentials.remember({ identifier: account.email, password: account.password });
      router.push({ pathname: "/verify-email", params: { email: account.email } });
    },
    onError: (error) => {
      const apiError = toApiError(error);
      haptics.error();
      const mapped = applyServerFieldErrors(apiError, setError, FIELDS, {
        EMAIL_TAKEN: "email",
        USERNAME_TAKEN: "username",
      });
      setFailure(mapped ? null : apiError);
    },
  });

  const submit = handleSubmit((account) => {
    setFailure(null);
    signup.mutate(account);
  });

  return (
    <AuthScaffold
      title="Join DevHub"
      subtitle="Claim your handle. We'll email you a code to confirm it's really you."
      footer={
        <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
          <AppText variant="subhead" tone="secondary">
            Already on DevHub?
          </AppText>
          <TextLink label="Sign in" onPress={() => router.replace("/log-in")} />
        </View>
      }
    >
      {failure && <FormBanner tone="error" message={failure.message} retryAfterSeconds={failure.retryAfterSeconds} />}

      <FormTextField
        control={control}
        name="username"
        label="Username"
        placeholder="ada_dev"
        hint="Letters, digits and underscores. This is your @handle."
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        mono
      />
      <FormTextField
        control={control}
        name="displayName"
        label="Display name"
        placeholder="Ada Lovelace"
        autoComplete="name"
        textContentType="name"
      />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        placeholder="ada@devhub.dev"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        placeholder="At least 8 characters"
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button label="Create account" icon="forward" onPress={submit} loading={signup.isPending} />
    </AuthScaffold>
  );
}
