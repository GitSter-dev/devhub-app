import { useInfiniteQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import { fetchFollowList, type FollowList } from "@/api/profiles-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { ScreenHeader } from "@/components/screen-header";
import { ConnectedPersonRow } from "@/features/people/connected-person-row";
import { sessionManager } from "@/session/session-manager";
import { layoutSpacing, maxContentWidth, spacing, useThemeColors } from "@/theme";

import { profileKeys } from "./profile-queries";

const TITLES: Record<FollowList, string> = { followers: "Followers", following: "Following" };

export function FollowListScreen({ username, list }: { username: string; list: FollowList }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const query = useInfiniteQuery({
    queryKey: profileKeys.list(username, list),
    queryFn: ({ pageParam }) => fetchFollowList(sessionManager.client, username, list, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  });
  const people = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <FlatList
        data={people}
        keyExtractor={(person) => person.id}
        renderItem={({ item }) => <ConnectedPersonRow person={item} />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title={`${TITLES[list]} · @${username}`} />
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
            <AppText variant="body" tone="tertiary" center>
              {list === "followers" ? "No followers yet." : "Not following anyone yet."}
            </AppText>
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
    height: layoutSpacing.listGap,
  },
  state: {
    gap: spacing.md,
  },
});
