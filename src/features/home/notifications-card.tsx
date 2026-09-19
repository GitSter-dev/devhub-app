import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";

import { toApiError, type ApiError } from "@/api/api-error";
import { sendTestNotification } from "@/api/devices-api";
import { newIdempotencyKey } from "@/api/idempotency";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { Icon, type IconName } from "@/components/icon";
import { TextLink } from "@/components/text-link";
import { haptics } from "@/feedback/haptics";
import { enablePush, registerCurrentDevice } from "@/push/push-registration";
import { dismissPushPrompt, usePushPromptDismissed, usePushState } from "@/push/push-state";
import { sessionManager } from "@/session/session-manager";
import { componentRadius, continuous, layoutSpacing, spacing, useTheme } from "@/theme";

const SENT_MESSAGE = "On its way. It should land in a few seconds.";

export function NotificationsCard() {
  const state = usePushState();
  const dismissed = usePushPromptDismissed();
  const [testResult, setTestResult] = useState<{ sent: true } | { failure: ApiError } | null>(null);

  const test = useMutation({
    mutationFn: () => sendTestNotification(sessionManager.client, newIdempotencyKey()),
    onSuccess: () => {
      haptics.success();
      setTestResult({ sent: true });
    },
    onError: (error) => {
      haptics.error();
      setTestResult({ failure: toApiError(error) });
    },
  });

  if (state.status === "unknown" || state.status === "unsupported") return null;

  if (state.status === "enabled") {
    return (
      <Card icon="bell" title="Notifications are on" body="We'll ping you when builders reply, mention or follow you.">
        {testResult && "sent" in testResult && <FormBanner tone="success" message={SENT_MESSAGE} />}
        {testResult && "failure" in testResult && (
          <FormBanner
            tone="error"
            message={testResult.failure.message}
            retryAfterSeconds={testResult.failure.retryAfterSeconds}
          />
        )}
        <Button
          label="Send a test notification"
          variant="secondary"
          loading={test.isPending}
          onPress={() => {
            setTestResult(null);
            test.mutate();
          }}
        />
      </Card>
    );
  }

  if (state.status === "failed") {
    return (
      <Card icon="bellOff" title="Couldn't turn on notifications" body={state.message}>
        <Button label="Try again" variant="secondary" onPress={() => void registerCurrentDevice()} />
      </Card>
    );
  }

  if (dismissed) return null;

  if (state.status === "permission" && state.permission === "blocked") {
    return (
      <Card
        icon="bellOff"
        title="Notifications are off"
        body="Turn them on in system settings to hear when builders reply to you."
      >
        <View style={styles.actions}>
          <TextLink label="Open settings" onPress={() => void Linking.openSettings()} />
          <TextLink label="Not now" onPress={dismissPushPrompt} />
        </View>
      </Card>
    );
  }

  return (
    <Card icon="bell" title="Never miss a reply" body="Get a nudge when someone replies to you, mentions you or follows you.">
      <Button
        label="Turn on notifications"
        icon="forward"
        loading={state.status === "registering"}
        onPress={() => void enablePush()}
      />
      <View style={styles.center}>
        <TextLink label="Not now" onPress={dismissPushPrompt} />
      </View>
    </Card>
  );
}

function Card({ icon, title, body, children }: { icon: IconName; title: string; body: string; children: React.ReactNode }) {
  const { colors, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        continuous,
        { backgroundColor: colors.backgroundSurface, borderColor: colors.borderAccentSubtle, boxShadow: shadows.sm },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.backgroundAccentSubtle }]}>
          <Icon name={icon} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <AppText variant="headline">{title}</AppText>
          <AppText variant="footnote" tone="secondary">
            {body}
          </AppText>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  center: {
    alignItems: "center",
  },
});
