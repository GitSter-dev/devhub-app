import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { Icon } from "@/components/icon";
import { TextLink } from "@/components/text-link";
import { Wordmark } from "@/components/wordmark";
import { FeedTeaser } from "@/features/home/feed-teaser";
import { NotificationsCard } from "@/features/home/notifications-card";
import { ProfileCard } from "@/features/home/profile-card";
import { ProfileCardSkeleton } from "@/features/home/profile-card-skeleton";
import { sessionManager } from "@/session/session-manager";
import { useCurrentUser, useSessionState } from "@/session/use-session";
import { hitSlop, layoutSpacing, maxContentWidth, minTouchTarget, spacing, useThemeColors } from "@/theme";

export default function HomeScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const session = useSessionState();
  const { data: user, error, refetch, isFetching } = useCurrentUser();
  const offline = session.status === "signedIn" && !session.online;
  const [pulling, setPulling] = useState(false);

  const pullToRefresh = () => {
    setPulling(true);
    void refetch().finally(() => setPulling(false));
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundCanvas }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={pullToRefresh}
          tintColor={colors.accent}
          colors={[colors.accentSolid]}
          progressBackgroundColor={colors.backgroundElevated}
        />
      }
      contentContainerStyle={[styles.page, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.column}>
        <View style={styles.header}>
          <Wordmark />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Find developers"
              hitSlop={hitSlop}
              onPress={() => router.push("/search")}
              style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
            >
              <Icon name="search" color={colors.textSecondary} />
            </Pressable>
            {user && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Your profile"
                hitSlop={hitSlop}
                onPress={() => router.push({ pathname: "/u/[username]", params: { username: user.username } })}
                style={[
                  styles.iconButton,
                  { borderColor: colors.borderAccentSubtle, backgroundColor: colors.backgroundAccentSubtle },
                ]}
              >
                <AppText variant="headline" tone="accent">
                  {user.displayName.charAt(0).toUpperCase()}
                </AppText>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              hitSlop={hitSlop}
              onPress={() => void sessionManager.signOut()}
              style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
            >
              <Icon name="logout" color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {offline && (
          <View style={styles.offline}>
            <FormBanner tone="info" message="You're offline. We'll reconnect as soon as the network is back." />
            <TextLink label="Try now" onPress={() => sessionManager.retryConnection()} />
          </View>
        )}

        <View style={styles.greeting}>
          <AppText variant="footnote" tone="tertiary">
            {user ? "Signed in" : "Loading"}
          </AppText>
          <AppText variant="title1">{user ? `Hey, ${user.displayName.split(" ")[0]}` : "Welcome"}</AppText>
        </View>

        {user ? (
          <ProfileCard user={user} />
        ) : error && !offline ? (
          <View style={styles.errorState}>
            <FormBanner tone="error" message={error.message} />
            <Button label="Try again" variant="secondary" onPress={() => void refetch()} loading={isFetching} />
          </View>
        ) : (
          <ProfileCardSkeleton />
        )}

        <NotificationsCard />

        <FeedTeaser />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: "center",
    paddingHorizontal: layoutSpacing.screenX,
  },
  column: {
    width: "100%",
    maxWidth: maxContentWidth,
    gap: layoutSpacing.sectionGap,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  offline: {
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  greeting: {
    gap: spacing.xxs,
  },
  errorState: {
    gap: spacing.md,
  },
});
