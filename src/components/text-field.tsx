import { useState, type Ref } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { borderWidth, componentRadius, continuous, fontFamily, hitSlop, maxFontScale, minTouchTarget, spacing, type, useThemeColors } from "@/theme";

import { AppText } from "./app-text";
import { Icon } from "./icon";

type TextFieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string;
  hint?: string;
  secure?: boolean;
  mono?: boolean;
  ref?: Ref<TextInput>;
};

export function TextField({ label, error, hint, secure = false, mono = false, onFocus, onBlur, ref, ...input }: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.borderFocus : colors.border;

  return (
    <View style={styles.field}>
      <AppText variant="footnote" tone="secondary" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.inputRow,
          continuous,
          { backgroundColor: colors.backgroundSunken, borderColor, borderWidth: focused || error ? borderWidth.thick : borderWidth.thin },
        ]}
      >
        <TextInput
          maxFontSizeMultiplier={maxFontScale}
          {...input}
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[type.callout, styles.input, { color: colors.textPrimary }, mono && { fontFamily: fontFamily.mono }]}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            hitSlop={hitSlop}
            onPress={() => setRevealed((value) => !value)}
            style={styles.reveal}
          >
            <Icon name={revealed ? "hide" : "show"} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      {(error || hint) && (
        <AppText variant="footnote" tone={error ? "danger" : "tertiary"} accessibilityLiveRegion="polite">
          {error ?? hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: spacing.xxs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: minTouchTarget + spacing.sm,
    borderRadius: componentRadius.input,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  reveal: {
    marginLeft: spacing.sm,
    minWidth: minTouchTarget - spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
