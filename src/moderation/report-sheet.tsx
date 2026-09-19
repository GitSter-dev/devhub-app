import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import { blocksApi } from "@/api/blocks-api";
import { queryClient } from "@/api/query-client";
import { reportsApi, type ReportReason } from "@/api/reports-api";
import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { TextField } from "@/components/text-field";
import { chatStore } from "@/chat/chat-store";
import { withoutMessageContent } from "@/chat/conversation-state";
import { haptics } from "@/feedback/haptics";
import { postKeys } from "@/features/posts/post-queries";
import { sessionManager } from "@/session/session-manager";
import { componentRadius, continuous, hitSlop, layoutSpacing, minTouchTarget, spacing, useThemeColors } from "@/theme";

import { reportFlow, useReportTarget, type ReportTarget } from "./report-store";

const REASONS: { reason: ReportReason; label: string; hint: string }[] = [
  { reason: "SPAM", label: "Spam", hint: "Scams, bots or repeated promotion" },
  { reason: "HARASSMENT", label: "Harassment", hint: "Bullying, threats or targeting someone" },
  { reason: "HATE", label: "Hate speech", hint: "Attacks on people for who they are" },
  { reason: "SEXUAL", label: "Sexual content", hint: "Nudity or sexual content" },
  { reason: "VIOLENCE", label: "Violence", hint: "Graphic violence or threats of it" },
  { reason: "SELF_HARM", label: "Self-harm", hint: "Someone may be in danger" },
  { reason: "IMPERSONATION", label: "Impersonation", hint: "Pretending to be someone else" },
  { reason: "OTHER", label: "Something else", hint: "Tell us what is wrong" },
];

const TITLES: Record<ReportTarget["type"], string> = {
  POST: "Report this post",
  MESSAGE: "Report this message",
  USER: "Report this profile",
};

export function ReportSheet() {
  const colors = useThemeColors();
  const target = useReportTarget();

  return (
    <Modal
      visible={target !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={reportFlow.close}
    >
      <Pressable
        style={[styles.scrim, { backgroundColor: colors.scrim }]}
        onPress={reportFlow.close}
        accessibilityLabel="Close"
      />
      {target && <ReportBody key={target.id} target={target} />}
    </Modal>
  );
}

function ReportBody({ target }: { target: ReportTarget }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");

  const submit = useMutation({
    mutationFn: ({ reason }: { reason: ReportReason }) =>
      reportsApi.report(sessionManager.client, {
        targetType: target.type,
        targetId: target.id,
        reason,
        note: note.trim() ? note.trim() : undefined,
      }),
    onSuccess: async () => {
      reportFlow.close();
      haptics.success();
      if (target.type === "MESSAGE" && target.conversationId) {
        await chatStore.updateMessages(target.conversationId, (message) => withoutMessageContent(message, target.id));
      }
      void queryClient.invalidateQueries({ queryKey: postKeys.all });
      offerBlock(target);
    },
    onError: (error) => {
      haptics.error();
      Alert.alert("Couldn't send the report", toApiError(error).message);
    },
  });

  return (
    <View
      style={[
        styles.sheet,
        continuous,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.border,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="title3">{TITLES[target.type]}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={hitSlop} onPress={reportFlow.close}>
          <Icon name="close" color={colors.textSecondary} size="sm" />
        </Pressable>
      </View>
      <AppText variant="footnote" tone="secondary">
        Moderators see a copy of what you report, even if it is deleted afterwards. Nobody is told who reported them.
      </AppText>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        <TextField
          label="Add a note (optional)"
          placeholder="Anything the moderators should know"
          value={note}
          onChangeText={setNote}
          maxLength={500}
          multiline
        />
        {REASONS.map(({ reason, label, hint }) => (
          <Pressable
            key={reason}
            accessibilityRole="button"
            disabled={submit.isPending}
            onPress={() => submit.mutate({ reason })}
            style={({ pressed }) => [styles.reason, pressed && { backgroundColor: colors.border }]}
          >
            <View style={styles.reasonText}>
              <AppText variant="body">{label}</AppText>
              <AppText variant="footnote" tone="tertiary">
                {hint}
              </AppText>
            </View>
            <Icon name="forward" color={colors.textTertiary} size="sm" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function offerBlock(target: ReportTarget): void {
  if (!target.userId || !target.username) {
    Alert.alert("Thanks for reporting", "Our moderators will take a look.");
    return;
  }
  Alert.alert(
    "Thanks for reporting",
    `Our moderators will take a look. Do you also want to block @${target.username}?`,
    [
      { text: "Not now", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () => {
          void blocksApi
            .block(sessionManager.client, target.userId ?? "")
            .then(() => queryClient.invalidateQueries())
            .catch(() => Alert.alert("Couldn't block", "Check your connection and try again."));
        },
      },
    ],
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "85%",
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: layoutSpacing.screenX,
    borderTopLeftRadius: componentRadius.sheet,
    borderTopRightRadius: componentRadius.sheet,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  list: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: minTouchTarget,
    paddingVertical: spacing.sm,
  },
  reasonText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
