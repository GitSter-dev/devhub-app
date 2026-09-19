import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { Wordmark } from "@/components/wordmark";
import { haptics } from "@/feedback/haptics";
import { markOnboardingSeen } from "@/onboarding/onboarding-store";
import { hitSlop, layoutSpacing, maxContentWidth, minTouchTarget, spacing, useThemeColors } from "@/theme";

import { ComposerSlide } from "./composer-slide";
import { FeedSlide } from "./feed-slide";
import { IdentitySlide } from "./identity-slide";
import { PageIndicator } from "./page-indicator";
import { SlideFrame } from "./slide-frame";
import { TopicsSlide } from "./topics-slide";

const SLIDES = [
  {
    kicker: "The feed",
    title: "Your feed speaks code",
    body: "Posts from developers you follow, with real code blocks instead of screenshots of code.",
    render: (active: boolean) => <FeedSlide active={active} />,
  },
  {
    kicker: "Topics",
    title: "Follow your stack",
    body: "Pick the languages and tools you care about. Your feed tunes itself around them.",
    render: () => <TopicsSlide />,
  },
  {
    kicker: "Share",
    title: "Ship in public",
    body: "Post what you built, what broke and what you learned. Builders cheer each other on here.",
    render: (active: boolean) => <ComposerSlide active={active} />,
  },
  {
    kicker: "Profile",
    title: "Your dev identity",
    body: "A profile that shows your stack and your streak, not a résumé.",
    render: (active: boolean) => <IdentitySlide active={active} />,
  },
];

const LAST = SLIDES.length - 1;

export function OnboardingPager() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const progress = useSharedValue(0);
  const [page, setPage] = useState(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    progress.set(event.contentOffset.x);
  });

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    if (next !== page) {
      haptics.selection();
      setPage(next);
    }
  };

  const finish = (destination: "/sign-up" | "/log-in") => {
    router.replace(destination);
    markOnboardingSeen();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <Wordmark />
        {page < LAST ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Skip the tour" hitSlop={hitSlop} onPress={() => goTo(LAST)} style={styles.skip}>
            <AppText variant="subhead" tone="secondary">
              Skip
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.skip} />
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (next !== page) {
            haptics.selection();
            setPage(next);
          }
        }}
        style={styles.pager}
      >
        {SLIDES.map((slide, index) => (
          <SlideFrame
            key={slide.title}
            index={index}
            width={width}
            progress={progress}
            kicker={slide.kicker}
            title={slide.title}
            body={slide.body}
          >
            {slide.render(page === index)}
          </SlideFrame>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerColumn}>
          <PageIndicator count={SLIDES.length} progress={progress} pageWidth={width} />
          {page < LAST ? (
            <View style={styles.ctas}>
              <Button label="Next" icon="forward" onPress={() => goTo(page + 1)} />
            </View>
          ) : (
            <View style={styles.ctas}>
              <Button label="Create your account" icon="forward" onPress={() => finish("/sign-up")} />
              <Button label="I already have an account" variant="ghost" onPress={() => finish("/log-in")} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layoutSpacing.screenX,
    minHeight: minTouchTarget + spacing.sm,
  },
  skip: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  pager: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: layoutSpacing.screenX,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    alignItems: "center",
  },
  footerColumn: {
    width: "100%",
    maxWidth: maxContentWidth,
    gap: spacing.lg,
    alignItems: "center",
  },
  ctas: {
    alignSelf: "stretch",
    gap: spacing.sm,
  },
});
