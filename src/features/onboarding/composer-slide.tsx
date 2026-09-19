import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { BlinkingCursor } from "@/components/blinking-cursor";
import { Icon } from "@/components/icon";
import { avatarSize, componentRadius, continuous, layoutSpacing, radius, spacing, useTheme } from "@/theme";

import { LikeButton } from "./like-button";
import { MockPost } from "./mock-post";
import { useTypewriter } from "./use-typewriter";

const DRAFT = "Shipped offline sync for our CLI today. Zero dependencies, 40% faster cold start.";

export function ComposerSlide({ active }: { active: boolean }) {
  const { colors, shadows } = useTheme();
  const draft = useTypewriter(DRAFT, active, 2);
  const finished = draft.length === DRAFT.length;

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={[
          styles.composer,
          continuous,
          { backgroundColor: colors.backgroundElevated, borderColor: colors.borderAccentSubtle, boxShadow: shadows.md },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle }]}>
            <AppText variant="subhead" tone="accent">
              Y
            </AppText>
          </View>
          <View style={styles.draft}>
            <AppText variant="callout">{draft}</AppText>
            {!finished && <BlinkingCursor height={18} />}
          </View>
        </View>
        <View style={[styles.toolbar, { borderTopColor: colors.border }]}>
          <View style={[styles.attachment, { backgroundColor: colors.backgroundSunken }]}>
            <Icon name="code" color={colors.accent} size="sm" />
            <AppText variant="caption" tone="secondary">
              sync.rs
            </AppText>
          </View>
          <View style={[styles.post, { backgroundColor: finished ? colors.accentSolid : colors.backgroundSunken }]}>
            <AppText variant="caption" style={{ color: finished ? colors.onAccentSolid : colors.textTertiary }}>
              Post
            </AppText>
          </View>
        </View>
      </View>

      <MockPost
        name="Margaret H."
        handle="margaret"
        age="now"
        text="Landing on the moon was mostly error handling."
        likes={<LikeButton baseCount={1969} autoLike={active} />}
        replies={42}
        reposts={11}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  avatar: {
    width: avatarSize.sm,
    height: avatarSize.sm,
    borderRadius: componentRadius.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  draft: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    minHeight: 66,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
  },
  attachment: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  post: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: componentRadius.chip,
  },
});
