import { Pressable } from "react-native";

import { hitSlop, opacity } from "@/theme";

import { AppText } from "./app-text";

type TextLinkProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function TextLink({ label, onPress, disabled = false }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : 1 })}
    >
      <AppText variant="subhead" tone="link">
        {label}
      </AppText>
    </Pressable>
  );
}
