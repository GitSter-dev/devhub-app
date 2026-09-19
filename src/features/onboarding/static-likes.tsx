import { View } from "react-native";

import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { spacing, useThemeColors } from "@/theme";

export function StaticLikes({ count }: { count: number }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
      <Icon name="like" color={colors.textTertiary} size="sm" />
      <AppText variant="metric" tone="tertiary">
        {count}
      </AppText>
    </View>
  );
}
