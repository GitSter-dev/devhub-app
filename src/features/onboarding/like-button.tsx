import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { haptics } from "@/feedback/haptics";
import { hitSlop, spacing, useMotion, useThemeColors } from "@/theme";

const AUTO_LIKE_DELAY_MS = 900;

type SpringConfig = { damping: number; stiffness: number; mass: number };

function playBurst(scale: SharedValue<number>, squashMs: number, spring: SpringConfig): void {
  scale.set(withSequence(withTiming(0.8, { duration: squashMs }), withSpring(1, spring)));
}

export function LikeButton({ baseCount, autoLike }: { baseCount: number; autoLike: boolean }) {
  const colors = useThemeColors();
  const { spring, duration } = useMotion();
  const [liked, setLiked] = useState(false);
  const scale = useSharedValue(1);

  const squashMs = duration.fast / 2;
  const bouncy = spring.bouncy;

  useEffect(() => {
    if (!autoLike) return;
    const timer = setTimeout(() => {
      setLiked(true);
      playBurst(scale, squashMs, bouncy);
    }, AUTO_LIKE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoLike, scale, squashMs, bouncy]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const toggle = () => {
    haptics.tap();
    setLiked((value) => !value);
    playBurst(scale, squashMs, bouncy);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: liked }}
      accessibilityLabel={liked ? "Unlike" : "Like"}
      hitSlop={hitSlop}
      onPress={toggle}
      style={styles.row}
    >
      <Animated.View style={animated}>
        <Icon name={liked ? "liked" : "like"} color={liked ? colors.danger : colors.textTertiary} size="sm" />
      </Animated.View>
      <AppText variant="metric" tone={liked ? "danger" : "tertiary"}>
        {baseCount + (liked ? 1 : 0)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
