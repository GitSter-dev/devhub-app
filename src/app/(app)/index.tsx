import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchFeed } from "@/api/posts-api";
import { useUnreadTotal } from "@/chat/chat-queries";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { Icon } from "@/components/icon";
import { TextLink } from "@/components/text-link";
import { Wordmark } from "@/components/wordmark";
import { BadgedIconButton } from "@/features/home/badged-icon-button";
import { NotificationsCard } from "@/features/home/notifications-card";
import { useUnseenNotifications } from "@/features/notifications/notification-queries";
import { PostList } from "@/features/posts/post-list";
import { postKeys } from "@/features/posts/post-queries";
import { usePushState } from "@/push/push-state";
import { sessionManager } from "@/session/session-manager";
import { useCurrentUser, useSessionState } from "@/session/use-session";
import { hitSlop, minTouchTarget, spacing, useTheme } from "@/theme";

export default function HomeScreen() {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const session = useSessionState();
  const user = useCurrentUser().data;
  const push = usePushState();
  const offline = session.status === "signedIn" && !session.online;
  const unread = useUnreadTotal();
  const unseen = useUnseenNotifications();

  return (
    <View style={styles.screen}>
      <PostList
        queryKey={postKeys.feed}
        fetchPage={(cursor) => fetchFeed(sessionManager.client, cursor)}
        bottomInset={minTouchTarget + spacing.xl}
        header={
          <View style={styles.header}>
            <View style={styles.bar}>
              <Wordmark />
              <View style={styles.actions}>
                <BadgedIconButton icon="chat" label="Messages" count={unread} onPress={() => router.push("/messages")} />
                <BadgedIconButton
                  icon="notifications"
                  label="Notifications"
                  count={unseen}
                  onPress={() => router.push("/notifications")}
                />
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
                  accessibilityLabel="Settings"
                  hitSlop={hitSlop}
                  onPress={() => router.push("/settings")}
                  style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
                >
                  <Icon name="settings" color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>
            {offline && (
              <View style={styles.offline}>
                <FormBanner tone="info" message="You're offline. We'll reconnect as soon as the network is back." />
                <TextLink label="Try now" onPress={() => sessionManager.retryConnection()} />
              </View>
            )}
            {push.status !== "enabled" && <NotificationsCard />}
          </View>
        }
        empty={
          <View style={styles.empty}>
            <AppText variant="title3" center>
              Your feed is quiet
            </AppText>
            <AppText variant="body" tone="secondary" center>
              Follow developers or add topics to your stack, and their posts will land here.
            </AppText>
            <Button label="Find developers" icon="search" onPress={() => router.push("/search")} />
            <Button label="Edit your stack" variant="secondary" onPress={() => router.push("/profile/stack")} />
          </View>
        }
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New post"
        onPress={() => router.push("/compose")}
        style={[
          styles.fab,
          { bottom: insets.bottom + spacing.lg, backgroundColor: colors.accentSolid, boxShadow: shadows.accent },
        ]}
      >
        <Icon name="compose" color={colors.onAccentSolid} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: spacing.lg,
  },
  bar: {
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
  empty: {
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: minTouchTarget + spacing.md,
    height: minTouchTarget + spacing.md,
    borderRadius: (minTouchTarget + spacing.md) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
