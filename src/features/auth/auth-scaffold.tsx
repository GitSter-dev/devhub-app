import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { FormBanner } from "@/components/form-banner";
import { Icon } from "@/components/icon";
import { KeyboardScreen } from "@/components/keyboard-screen";
import { Wordmark } from "@/components/wordmark";
import { useAuthNotice } from "@/session/auth-notice";
import { useSessionState } from "@/session/use-session";
import { hitSlop, layoutSpacing, minTouchTarget, spacing, useThemeColors } from "@/theme";

import { reauthMessage } from "./reauth-copy";

type AuthScaffoldProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  showSessionNotice?: boolean;
};

export function AuthScaffold({ title, subtitle, children, footer, showSessionNotice = false }: AuthScaffoldProps) {
  const colors = useThemeColors();
  const notice = useAuthNotice();
  const session = useSessionState();
  const reauth = showSessionNotice ? reauthMessage(session) : null;
  const canGoBack = router.canGoBack();

  return (
    <KeyboardScreen>
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={hitSlop}
            onPress={() => router.back()}
            style={[styles.back, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
          >
            <Icon name="back" color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Wordmark />
        <View style={styles.back} />
      </View>

      <View style={styles.body}>
        {notice ? (
          <FormBanner tone={notice.tone} message={notice.message} />
        ) : reauth ? (
          <FormBanner tone="info" message={reauth} />
        ) : null}

        <View style={styles.heading}>
          <AppText variant="display" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="callout" tone="secondary">
              {subtitle}
            </AppText>
          )}
        </View>

        <View style={styles.content}>{children}</View>
      </View>

      {footer && <View style={styles.footer}>{footer}</View>}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: layoutSpacing.sectionGap,
  },
  back: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    gap: layoutSpacing.sectionGap,
  },
  heading: {
    gap: spacing.sm,
  },
  content: {
    gap: spacing.base,
  },
  footer: {
    marginTop: "auto",
    paddingTop: layoutSpacing.sectionGap,
    alignItems: "center",
    gap: spacing.sm,
  },
});
