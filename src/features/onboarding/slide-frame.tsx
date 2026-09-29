import type { ReactNode } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
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
const MOCK_HEIGHT = 330;
const MOCK_SHARE_OF_SCREEN = 0.4;
const COMPACT_HEIGHT = 740;
const COMPACT_FONT_SCALE = 1.1;

export function SlideFrame({ index, width, progress, kicker, title, body, children }: SlideFrameProps) {
  const { reduced } = useMotion();
  const { height, fontScale } = useWindowDimensions();
  const compact = height < COMPACT_HEIGHT || fontScale > COMPACT_FONT_SCALE;
  const mockHeight = Math.min(MOCK_HEIGHT, Math.round(height * MOCK_SHARE_OF_SCREEN));
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={[styles.column, compact && styles.textFirst]}>
          <Animated.View style={[styles.mock, { minHeight: mockHeight }, mock]}>{children}</Animated.View>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    paddingHorizontal: layoutSpacing.screenX,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.base,
  },
  column: {
    flexGrow: 1,
    width: "100%",
    maxWidth: maxContentWidth,
    justifyContent: "center",
    gap: layoutSpacing.sectionGap,
  },
  textFirst: {
    flexDirection: "column-reverse",
    justifyContent: "flex-end",
  },
  mock: {
    justifyContent: "center",
  },
  copy: {
    gap: spacing.sm,
  },
});
