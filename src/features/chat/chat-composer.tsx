import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ChatMessage } from "@/api/chat-api";
import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { typing } from "@/chat/typing";
import { haptics } from "@/feedback/haptics";
import { componentRadius, fontFamily, hitSlop, layoutSpacing, minTouchTarget, spacing, type, useThemeColors } from "@/theme";

const BODY_LIMIT = 4000;
const CODE_LIMIT = 4000;
const LANGUAGE = /^[a-z0-9+#.-]{1,20}$/;

type ChatComposerProps = {
  conversationId: string;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (draft: { body: string | null; code: string | null; codeLanguage: string | null }) => void;
};

export function ChatComposer({ conversationId, replyTo, onCancelReply, onSend }: ChatComposerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [withCode, setWithCode] = useState(false);

  const trimmedBody = body.trim();
  const trimmedCode = code.replace(/\s+$/, "");
  const normalizedLanguage = language.trim().toLowerCase();
  const languageValid = normalizedLanguage === "" || LANGUAGE.test(normalizedLanguage);
  const canSend = (trimmedBody !== "" || trimmedCode !== "") && languageValid;

  const send = () => {
    if (!canSend) return;
    haptics.tap();
    onSend({
      body: trimmedBody || null,
      code: trimmedCode || null,
      codeLanguage: trimmedCode && normalizedLanguage ? normalizedLanguage : null,
    });
    setBody("");
    setCode("");
    setLanguage("");
    setWithCode(false);
  };

  const inputStyle = [styles.input, { color: colors.textPrimary, backgroundColor: colors.backgroundSunken, borderColor: colors.border }];

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + spacing.sm, borderTopColor: colors.border, backgroundColor: colors.backgroundCanvas }]}>
      {replyTo && (
        <View style={[styles.reply, { borderLeftColor: colors.accentSolid, backgroundColor: colors.backgroundSunken }]}>
          <View style={styles.replyText}>
            <AppText variant="caption" tone="accent" numberOfLines={1}>
              Replying to {replyTo.sender?.displayName ?? "message"}
            </AppText>
            <AppText variant="footnote" tone="secondary" numberOfLines={1}>
              {replyTo.body ?? (replyTo.code ? "Code snippet" : "")}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel reply" hitSlop={hitSlop} onPress={onCancelReply}>
            <Icon name="close" color={colors.textTertiary} size="sm" />
          </Pressable>
        </View>
      )}
      {withCode && (
        <View style={styles.code}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Paste or write code"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={CODE_LIMIT}
            autoCapitalize="none"
            autoCorrect={false}
            style={[inputStyle, styles.codeInput]}
          />
          <TextInput
            value={language}
            onChangeText={setLanguage}
            placeholder="language (optional)"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            style={[inputStyle, !languageValid && { borderColor: colors.danger }]}
          />
        </View>
      )}
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={withCode ? "Remove code block" : "Add a code block"}
          accessibilityState={{ selected: withCode }}
          hitSlop={hitSlop}
          onPress={() => setWithCode((value) => !value)}
          style={styles.iconButton}
        >
          <Icon name="code" color={withCode ? colors.accent : colors.textTertiary} />
        </Pressable>
        <TextInput
          value={body}
          onChangeText={(text) => {
            setBody(text);
            if (text.trim()) typing.announce(conversationId);
          }}
          placeholder="Message"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={BODY_LIMIT}
          style={[inputStyle, styles.bodyInput]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={send}
          style={[styles.send, { backgroundColor: canSend ? colors.accentSolid : colors.backgroundSunken }]}
        >
          <Icon name="send" color={canSend ? colors.onAccentSolid : colors.textTertiary} size="sm" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: layoutSpacing.screenX,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reply: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 3,
    borderRadius: componentRadius.button,
  },
  replyText: {
    flex: 1,
  },
  code: {
    gap: spacing.xs,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  input: {
    ...type.callout,
    borderWidth: 1,
    borderRadius: componentRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bodyInput: {
    flex: 1,
    maxHeight: 140,
  },
  codeInput: {
    fontFamily: fontFamily.mono,
    minHeight: 72,
    maxHeight: 180,
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  send: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
