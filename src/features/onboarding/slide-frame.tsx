import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { AppText } from "@/components/app-text";
import { layoutSpacing, maxContentWidth, spacing, useMotion } from "@/theme";

type SlideFrameProps = {
  index: number;
  width: number;
  progress: SharedValue<number>;
  kicker: string;
  title: string;
  body: string;
  children: ReactNode;
};

const PARALLAX = 0.35;

export function SlideFrame({ index, width, progress, kicker, title, body, children }: SlideFrameProps) {
  const { reduced } = useMotion();
  const range = [(index - 1) * width, index * width, (index + 1) * width];
  const travel = reduced ? 0 : width * PARALLAX;

  const mock = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.get(), range, [travel, 0, -travel], Extrapolation.CLAMP) }],
  }));
  const copy = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), range, [0, 1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.column}>
        <Animated.View style={[styles.mock, mock]}>{children}</Animated.View>
        <Animated.View style={[styles.copy, copy]}>
          <AppText variant="overline" tone="accent" uppercase>
            {kicker}
          </AppText>
          <AppText variant="display">{title}</AppText>
          <AppText variant="callout" tone="secondary">
            {body}
          </AppText>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    paddingHorizontal: layoutSpacing.screenX,
    alignItems: "center",
  },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: maxContentWidth,
    justifyContent: "center",
    gap: layoutSpacing.sectionGap,
  },
  mock: {
    minHeight: 330,
    justifyContent: "center",
  },
  copy: {
    gap: spacing.sm,
  },
});
