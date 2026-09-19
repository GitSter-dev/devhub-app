import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { toApiError, type ApiError } from "@/api/api-error";
import { authApi } from "@/api/auth-api";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { AuthScaffold } from "@/features/auth/auth-scaffold";
import { haptics } from "@/feedback/haptics";
import { emailSchema, type EmailInput, type EmailValues } from "@/schemas/emailSchema";
import { clearAuthNotice } from "@/session/auth-notice";
import { useIdempotencyKey } from "@/session/use-idempotency-key";

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [failure, setFailure] = useState<ApiError | null>(null);

  const { control, handleSubmit } = useForm<EmailInput, unknown, EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: params.email ?? "" },
    mode: "onTouched",
  });
  const { keyFor, rotate } = useIdempotencyKey();

  const request = useMutation({
    mutationFn: ({ email }: EmailValues) => authApi.forgotPassword(email, keyFor(email)),
    onSuccess: (_, { email }) => {
      rotate();
      clearAuthNotice();
      router.push({ pathname: "/reset-password", params: { email } });
    },
    onError: (error) => {
      haptics.error();
      setFailure(toApiError(error));
    },
  });

  const submit = handleSubmit((payload) => {
    setFailure(null);
    request.mutate(payload);
  });

  return (
    <AuthScaffold
      title="Reset your password"
      subtitle="Enter the email on your account. If it's verified, we'll send a 6-digit reset code."
    >
      {failure && <FormBanner tone="error" message={failure.message} retryAfterSeconds={failure.retryAfterSeconds} />}

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
        returnKeyType="send"
        onSubmitEditing={submit}
      />

      <Button label="Send reset code" icon="mail" onPress={submit} loading={request.isPending} />
    </AuthScaffold>
  );
}
