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
import { AuthScaffold } from "@/features/auth/auth-scaffold";
import { useResendCooldown } from "@/features/auth/use-resend-cooldown";
import { haptics } from "@/feedback/haptics";
import { verifyEmailSchema, type VerifyEmailInput, type VerifyEmailValues } from "@/schemas/verifyEmailSchema";
import { clearAuthNotice, flashAuthNotice } from "@/session/auth-notice";
import { pendingCredentials } from "@/session/pending-credentials";
import { sessionManager } from "@/session/session-manager";
import { useIdempotencyKey } from "@/session/use-idempotency-key";
import { spacing } from "@/theme";

const RESENT_MESSAGE = "If this account still needs verifying, a fresh code is on its way.";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const knownEmail = params.email ?? "";
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const cooldown = useResendCooldown();

  const { control, handleSubmit, setValue, getValues } = useForm<VerifyEmailInput, unknown, VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: knownEmail, code: "" },
  });
  const { field: codeField, fieldState: codeState } = useController({ control, name: "code" });
  const { keyFor, rotate } = useIdempotencyKey();

  const finish = async () => {
    const credentials = pendingCredentials.take();
    if (credentials) {
      try {
        await sessionManager.startSession(await authApi.login(credentials, newIdempotencyKey()));
        return;
      } catch {}
    }
    flashAuthNotice({ tone: "success", message: "Email verified. Sign in to get started." });
    router.replace("/log-in");
  };

  const verify = useMutation({
    mutationFn: (payload: VerifyEmailValues) => authApi.verifyEmail(payload, keyFor(payload)),
    onSuccess: async () => {
      rotate();
      clearAuthNotice();
      haptics.success();
      await finish();
    },
    onError: (error) => {
      const apiError = toApiError(error);
      haptics.error();
      if (apiError.code === "INVALID_VERIFICATION_CODE") {
        setShakeKey((value) => value + 1);
        setValue("code", "");
      }
      setFailure(apiError);
    },
  });

  const submit = handleSubmit((payload) => {
    setFailure(null);
    setInfo(null);
    verify.mutate(payload);
  });

  const resend = () => {
    const email = getValues("email").trim();
    if (!email) return;
    authApi.resendVerification(email, newIdempotencyKey()).catch(() => undefined);
    cooldown.restart();
    setFailure(null);
    setInfo(RESENT_MESSAGE);
  };

  return (
    <AuthScaffold
      title="Check your inbox"
      subtitle={
        knownEmail
          ? `We sent a 6-digit code to ${knownEmail}. It expires in 15 minutes.`
          : "Enter your email and the 6-digit code we sent you."
      }
      footer={
        <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
          <AppText variant="subhead" tone="secondary">
            No email?
          </AppText>
          {cooldown.remaining > 0 ? (
            <AppText variant="metric" tone="tertiary">
              Resend in {cooldown.remaining}s
            </AppText>
          ) : (
            <TextLink label="Resend code" onPress={resend} />
          )}
        </View>
      }
    >
      {failure && <FormBanner tone="error" message={failure.message} retryAfterSeconds={failure.retryAfterSeconds} />}
      {info && <FormBanner tone="info" message={info} />}

      {!knownEmail && (
        <FormTextField
          control={control}
          name="email"
          label="Email"
          placeholder="ada@devhub.dev"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      )}

      <CodeInput
        label="Verification code"
        value={codeField.value}
        onChange={codeField.onChange}
        onComplete={() => submit()}
        shakeKey={shakeKey}
        invalid={Boolean(codeState.error) || failure?.code === "INVALID_VERIFICATION_CODE"}
        disabled={verify.isPending}
      />
      {codeState.error && (
        <AppText variant="footnote" tone="danger">
          {codeState.error.message}
        </AppText>
      )}

      <Button label="Verify email" onPress={submit} loading={verify.isPending} />
    </AuthScaffold>
  );
}
