import { View } from "react-native";

import { Icon } from "@/components/icon";
import { useThemeColors } from "@/theme";

import type { TickState } from "./conversation-display";

const ICONS = { pending: "pending", failed: "error", sent: "sent", delivered: "delivered", read: "delivered" } as const;
const LABELS: Record<TickState, string> = {
  pending: "Sending",
  failed: "Not sent",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
};

export function MessageTicks({ state }: { state: TickState }) {
  const colors = useThemeColors();
  const color = state === "read" ? colors.accent : state === "failed" ? colors.danger : colors.textTertiary;
  return (
    <View accessible accessibilityLabel={LABELS[state]}>
      <Icon name={ICONS[state]} color={color} size="xs" />
    </View>
  );
}
