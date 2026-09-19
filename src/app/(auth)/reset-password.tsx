import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { View } from "react-native";

import { toApiError, type ApiError } from "@/api/api-error";
import { authApi } from "@/api/auth-api";
import { newIdempotencyKey } from "@/api/idempotency";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { CodeInput } from "@/components/code-input";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { TextLink } from "@/components/text-link";
import { applyServerFieldErrors } from "@/features/auth/apply-server-errors";
import { AuthScaffold } from "@/features/auth/auth-scaffold";
import { useResendCooldown } from "@/features/auth/use-resend-cooldown";
import { haptics } from "@/feedback/haptics";
import { resetPasswordSchema, type ResetPasswordInput, type ResetPasswordValues } from "@/schemas/resetPasswordSchema";
import { flashAuthNotice } from "@/session/auth-notice";
import { useIdempotencyKey } from "@/session/use-idempotency-key";
import { spacing } from "@/theme";

const FIELDS = ["email", "code", "newPassword"] as const;
const SUCCESS_MESSAGE = "Password changed. For your security, every device was signed out.";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const cooldown = useResendCooldown();

  const { control, handleSubmit, setError, setValue, getValues } = useForm<ResetPasswordInput, unknown, ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: params.email ?? "", code: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const { field: codeField, fieldState: codeState } = useController({ control, name: "code" });
  const { keyFor, rotate } = useIdempotencyKey();

  const reset = useMutation({
    mutationFn: ({ email, code, newPassword }: ResetPasswordValues) => {
      const payload = { email, code, newPassword };
      return authApi.resetPassword(payload, keyFor(payload));
    },
    onSuccess: () => {
      rotate();
      haptics.success();
      flashAuthNotice({ tone: "success", message: SUCCESS_MESSAGE });
      router.dismissTo("/log-in");
    },
    onError: (error) => {
      const apiError = toApiError(error);
      haptics.error();
      if (apiError.code === "INVALID_RESET_CODE") {
        setShakeKey((value) => value + 1);
        setValue("code", "");
      }
      const mapped = applyServerFieldErrors(apiError, setError, FIELDS);
      setFailure(mapped ? null : apiError);
    },
  });

  const submit = handleSubmit((payload) => {
    setFailure(null);
    setInfo(null);
    reset.mutate(payload);
  });

  const resend = () => {
    const email = getValues("email").trim();
    if (!email) return;
    authApi.forgotPassword(email, newIdempotencyKey()).catch(() => undefined);
    cooldown.restart();
    setInfo("If this email belongs to a verified account, a new code is on its way.");
  };

  return (
    <AuthScaffold
      title="Choose a new password"
      subtitle="Enter the 6-digit code from the email, then pick a new password."
      footer={
        <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
          <AppText variant="subhead" tone="secondary">
            No code?
          </AppText>
          {cooldown.remaining > 0 ? (
            <AppText variant="metric" tone="tertiary">
              Resend in {cooldown.remaining}s
            </AppText>
          ) : (
            <TextLink label="Send a new one" onPress={resend} />
          )}
        </View>
      }
    >
      {failure && <FormBanner tone="error" message={failure.message} retryAfterSeconds={failure.retryAfterSeconds} />}
      {info && <FormBanner tone="info" message={info} />}

      <FormTextField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="footnote" tone="secondary">
          Reset code
        </AppText>
        <CodeInput
          label="Reset code"
          value={codeField.value}
          onChange={codeField.onChange}
          onComplete={() => undefined}
          shakeKey={shakeKey}
          invalid={Boolean(codeState.error) || failure?.code === "INVALID_RESET_CODE"}
          disabled={reset.isPending}
        />
        {codeState.error && (
          <AppText variant="footnote" tone="danger">
            {codeState.error.message}
          </AppText>
        )}
      </View>

      <FormTextField
        control={control}
        name="newPassword"
        label="New password"
        placeholder="At least 8 characters"
        secure
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirm new password"
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button label="Change password" icon="lock" onPress={submit} loading={reset.isPending} />
    </AuthScaffold>
  );
}
