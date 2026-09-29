import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { borderWidth, componentRadius, continuous, fontFamily, maxFontScale, spacing, useMotion, useThemeColors } from "@/theme";

import { AppText } from "./app-text";

const CODE_LENGTH = 6;
const SHAKE_DISTANCE = 10;

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  shakeKey: number;
  invalid?: boolean;
  disabled?: boolean;
  label: string;
};

export function CodeInput({ value, onChange, onComplete, shakeKey, invalid = false, disabled = false, label }: CodeInputProps) {
  const colors = useThemeColors();
  const { duration, reduced } = useMotion();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (shakeKey === 0 || reduced) return;
    const step = { duration: duration.fast / 2 };
    offset.set(
      withSequence(
        withTiming(-SHAKE_DISTANCE, step),
        withTiming(SHAKE_DISTANCE, step),
        withTiming(-SHAKE_DISTANCE * 0.6, step),
        withTiming(SHAKE_DISTANCE * 0.6, step),
        withTiming(0, step),
      ),
    );
  }, [shakeKey, reduced, duration.fast, offset]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
    onChange(digits);
    if (digits.length === CODE_LENGTH) onComplete(digits);
  };

  return (
    <Pressable accessibilityLabel={label} onPress={() => inputRef.current?.focus()} disabled={disabled}>
      <Animated.View style={[styles.row, shakeStyle]}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const digit = value[index] ?? "";
          const active = focused && index === Math.min(value.length, CODE_LENGTH - 1);
          const borderColor = invalid ? colors.danger : active ? colors.borderFocus : digit ? colors.borderStrong : colors.border;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                continuous,
                {
                  backgroundColor: colors.backgroundSunken,
                  borderColor,
                  borderWidth: active || invalid ? borderWidth.thick : borderWidth.thin,
                },
              ]}
            >
              <AppText variant="title2" tone={invalid ? "danger" : "primary"} style={styles.digit}>
                {digit}
              </AppText>
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        maxFontSizeMultiplier={maxFontScale}
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        autoFocus
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.82,
    maxWidth: 56,
    borderRadius: componentRadius.input,
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    fontFamily: fontFamily.monoMedium,
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.01,
    color: "transparent",
  },
});
