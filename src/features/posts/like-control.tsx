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

type SpringConfig = { damping: number; stiffness: number; mass: number };

export function playLikeBurst(scale: SharedValue<number>, squashMs: number, spring: SpringConfig): void {
  scale.set(withSequence(withTiming(0.8, { duration: squashMs }), withSpring(1, spring)));
}

type LikeControlProps = {
  liked: boolean;
  count: number;
  onToggle: () => void;
  scale?: SharedValue<number>;
};

export function LikeControl({ liked, count, onToggle, scale: externalScale }: LikeControlProps) {
  const colors = useThemeColors();
  const { spring, duration } = useMotion();
  const ownScale = useSharedValue(1);
  const scale = externalScale ?? ownScale;
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const toggle = () => {
    haptics.tap();
    playLikeBurst(scale, duration.fast / 2, spring.bouncy);
    onToggle();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: liked }}
      accessibilityLabel={`${liked ? "Unlike" : "Like"}, ${count} ${count === 1 ? "like" : "likes"}`}
      hitSlop={hitSlop}
      onPress={toggle}
      style={styles.row}
    >
      <Animated.View style={animated}>
        <Icon name={liked ? "liked" : "like"} color={liked ? colors.danger : colors.textTertiary} size="sm" />
      </Animated.View>
      <AppText variant="metric" tone={liked ? "danger" : "tertiary"}>
        {count}
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
