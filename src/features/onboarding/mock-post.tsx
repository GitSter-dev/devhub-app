import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { avatarSize, componentRadius, continuous, layoutSpacing, spacing, useTheme } from "@/theme";

type MockPostProps = {
  name: string;
  handle: string;
  age: string;
  text: string;
  code?: ReactNode;
  likes: ReactNode;
  replies: number;
  reposts: number;
};

export function MockPost({ name, handle, age, text, code, likes, replies, reposts }: MockPostProps) {
  const { colors, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        continuous,
        { backgroundColor: colors.backgroundSurface, borderColor: colors.border, boxShadow: shadows.md },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle }]}>
          <AppText variant="headline" tone="accent">
            {name.charAt(0)}
          </AppText>
        </View>
        <View style={styles.author}>
          <AppText variant="headline" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="handle" tone="tertiary">
            @{handle} · {age}
          </AppText>
        </View>
      </View>

      <AppText variant="callout">{text}</AppText>

      {code && (
        <View style={[styles.code, continuous, { backgroundColor: colors.codeBackground, borderColor: colors.codeBorder }]}>
          {code}
        </View>
      )}

      <View style={styles.metrics}>
        {likes}
        <Metric icon="reply" value={replies} color={colors.textTertiary} />
        <Metric icon="repost" value={reposts} color={colors.textTertiary} />
      </View>
    </View>
  );
}

function Metric({ icon, value, color }: { icon: "reply" | "repost"; value: number; color: string }) {
  return (
    <View style={styles.metric}>
      <Icon name={icon} color={color} size="sm" />
      <AppText variant="metric" tone="tertiary">
        {value}
      </AppText>
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
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: avatarSize.md,
    height: avatarSize.md,
    borderRadius: componentRadius.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  author: {
    flex: 1,
  },
  code: {
    padding: spacing.md,
    borderRadius: componentRadius.image,
    borderWidth: 1,
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
