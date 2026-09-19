import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, View } from "react-native";

import { accountApi } from "@/api/account-api";
import { toApiError, type ApiError } from "@/api/api-error";
import { authApi } from "@/api/auth-api";
import { newIdempotencyKey } from "@/api/idempotency";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { TextLink } from "@/components/text-link";
import { AuthScaffold } from "@/features/auth/auth-scaffold";
import { haptics } from "@/feedback/haptics";
import { loginSchema, type LoginInput, type LoginValues } from "@/schemas/loginSchema";
import { clearAuthNotice } from "@/session/auth-notice";
import { lastUserStore } from "@/session/last-user-store";
import { pendingCredentials } from "@/session/pending-credentials";
import { sessionManager } from "@/session/session-manager";
import { useIdempotencyKey } from "@/session/use-idempotency-key";
import { useSessionState } from "@/session/use-session";
import { spacing } from "@/theme";

function looksLikeEmail(identifier: string): boolean {
  return identifier.includes("@");
}

export default function LogInScreen() {
  const session = useSessionState();
  const [lastUser] = useState(() => (session.status === "reauthRequired" ? lastUserStore.read() : null));
  const [failure, setFailure] = useState<ApiError | null>(null);

  const { control, handleSubmit, reset, getValues } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: lastUser?.username ?? "", password: "" },
    mode: "onTouched",
  });
  const { keyFor, rotate } = useIdempotencyKey();

  const login = useMutation({
    mutationFn: (credentials: LoginValues) => authApi.login(credentials, keyFor(credentials)),
    onSuccess: async (pair) => {
      rotate();
      clearAuthNotice();
      haptics.success();
      await sessionManager.startSession(pair);
    },
    onError: (error, credentials) => {
      const apiError = toApiError(error);
      if (apiError.code === "EMAIL_NOT_VERIFIED") {
        pendingCredentials.remember(credentials);
        const email = looksLikeEmail(credentials.identifier) ? credentials.identifier : undefined;
        if (email) authApi.resendVerification(email, newIdempotencyKey()).catch(() => undefined);
        router.push({ pathname: "/verify-email", params: email ? { email } : {} });
        return;
      }
      if (apiError.code === "ACCOUNT_DEACTIVATED") {
        haptics.error();
        offerRestore(credentials);
        return;
      }
      haptics.error();
      setFailure(apiError);
    },
  });

  const offerRestore = (credentials: LoginValues) =>
    Alert.alert(
      "This account is scheduled for deletion",
      "Restore it now and everything comes back, or leave it and it is erased 30 days after you asked.",
      [
        { text: "Leave it", style: "cancel" },
        {
          text: "Restore",
          onPress: () => {
            void accountApi
              .restore(credentials.identifier, credentials.password)
              .then((pair) => sessionManager.startSession(pair))
              .catch((error: unknown) => setFailure(toApiError(error)));
          },
        },
      ],
    );

  const submit = handleSubmit((credentials) => {
    setFailure(null);
    login.mutate(credentials);
  });

  const useAnotherAccount = () => {
    lastUserStore.clear();
    sessionManager.dismissReauth();
    reset({ identifier: "", password: "" });
  };

  const forgotPassword = () => {
    const identifier = getValues("identifier").trim();
    router.push({ pathname: "/forgot-password", params: looksLikeEmail(identifier) ? { email: identifier } : {} });
  };

  return (
    <AuthScaffold
      showSessionNotice
      title={lastUser ? `Welcome back, ${lastUser.displayName}` : "Welcome back"}
      subtitle={lastUser ? `Sign in as @${lastUser.username} to continue.` : "Sign in with your email or username."}
      footer={
        <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
          <AppText variant="subhead" tone="secondary">
            New to DevHub?
          </AppText>
          <TextLink label="Create an account" onPress={() => router.push("/sign-up")} />
        </View>
      }
    >
      {failure && <FormBanner tone="error" message={failure.message} retryAfterSeconds={failure.retryAfterSeconds} />}

      <FormTextField
        control={control}
        name="identifier"
        label="Email or username"
        placeholder="ada@devhub.dev"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
      />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        placeholder="Your password"
        secure
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <View style={{ alignSelf: "flex-end" }}>
        <TextLink label="Forgot password?" onPress={forgotPassword} />
      </View>

      <Button label="Sign in" icon="forward" onPress={submit} loading={login.isPending} />

      {lastUser && (
        <View style={{ alignItems: "center" }}>
          <TextLink label={`Not @${lastUser.username}? Use another account`} onPress={useAnotherAccount} />
        </View>
      )}
    </AuthScaffold>
  );
}
