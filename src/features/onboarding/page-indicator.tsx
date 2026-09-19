import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { useThemeColors } from "@/theme";

const DOT = 8;
const GAP = 12;
const PILL = 20;
const INSET = (PILL - DOT) / 2;

type PageIndicatorProps = { count: number; progress: SharedValue<number>; pageWidth: number };

export function PageIndicator({ count, progress, pageWidth }: PageIndicatorProps) {
  const colors = useThemeColors();

  const pill = useAnimatedStyle(() => {
    const page = pageWidth > 0 ? progress.get() / pageWidth : 0;
    return { transform: [{ translateX: page * (DOT + GAP) }] };
  });

  return (
    <View
      accessibilityRole="progressbar"
      style={{ width: count * DOT + (count - 1) * GAP + (PILL - DOT), height: DOT }}
    >
      <View style={styles.dots}>
        {Array.from({ length: count }, (_, index) => (
          <View key={index} style={[styles.dot, { backgroundColor: colors.borderStrong }]} />
        ))}
      </View>
      <Animated.View style={[styles.pillTrack, pill]}>
        <View style={[styles.pill, { backgroundColor: colors.accentSolid }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    gap: GAP,
    paddingLeft: INSET,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  pillTrack: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  pill: {
    width: PILL,
    height: DOT,
    borderRadius: DOT / 2,
  },
});
