import { useFocusEffect, useScrollToTop } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import type { ActivityNotification } from "@/api/notifications-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { ScreenHeader } from "@/components/screen-header";
import { markNotificationsSeen, useNotifications } from "@/features/notifications/notification-queries";
import { openNotification } from "@/features/notifications/notification-route";
import { NotificationRow } from "@/features/notifications/notification-row";
import { layoutSpacing, maxContentWidth, spacing, useThemeColors } from "@/theme";

function open(notification: ActivityNotification): void {
  openNotification({
    type: notification.type,
    subjectId: notification.subjectId,
    targetId: notification.targetId,
    actorCount: notification.actorCount,
    actorUsername: notification.actors[0]?.username ?? null,
  });
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const query = useNotifications();
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set());
  const newest = items[0]?.updatedAt ?? null;
  const list = useRef<FlatList<ActivityNotification>>(null);
  useScrollToTop(list);

  const newlyUnseen = items.filter((item) => !item.seen && !fresh.has(item.id));
  if (newlyUnseen.length > 0) setFresh(new Set([...fresh, ...newlyUnseen.map((item) => item.id)]));

  useFocusEffect(
    useCallback(() => {
      if (newest) void markNotificationsSeen(newest).catch(() => undefined);
    }, [newest]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <FlatList
        ref={list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow notification={item} fresh={fresh.has(item.id)} onPress={() => open(item)} />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title="Notifications" showBack={false} />
          </View>
        }
        ListEmptyComponent={
          query.error ? (
            <View style={styles.state}>
              <FormBanner tone="error" message={toApiError(query.error).message} />
              <Button label="Try again" variant="secondary" onPress={() => void query.refetch()} />
            </View>
          ) : query.isPending ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <View style={styles.state}>
              <AppText variant="title3" center>
                Nothing yet
              </AppText>
              <AppText variant="body" tone="secondary" center>
                Likes, replies, new followers and posts from people you follow show up here.
              </AppText>
            </View>
          )
        }
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.accent} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layoutSpacing.screenX,
  },
  header: {
    marginBottom: layoutSpacing.sectionGap,
  },
  separator: {
    height: spacing.xxs,
  },
  state: {
    gap: spacing.md,
  },
});
