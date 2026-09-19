import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { useState, type ReactElement } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import type { PostPage } from "@/api/posts-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { layoutSpacing, maxContentWidth, spacing, useThemeColors } from "@/theme";

import { PostCard } from "./post-card";

type PostListProps = {
  queryKey: QueryKey;
  fetchPage: (cursor: string | null) => Promise<PostPage>;
  header?: ReactElement;
  empty?: ReactElement | string;
  enabled?: boolean;
  onRefresh?: () => Promise<unknown>;
  bottomInset?: number;
};

export function PostList({ queryKey, fetchPage, header, empty, enabled = true, onRefresh, bottomInset = 0 }: PostListProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [pulling, setPulling] = useState(false);
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled,
  });
  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];

  const refresh = () => {
    setPulling(true);
    void Promise.all([query.refetch(), onRefresh?.()]).finally(() => setPulling(false));
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.backgroundCanvas }}
      data={enabled ? posts : []}
      keyExtractor={(post) => post.id}
      renderItem={({ item }) => <PostCard post={item} />}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={refresh}
          tintColor={colors.accent}
          colors={[colors.accentSolid]}
          progressBackgroundColor={colors.backgroundElevated}
        />
      }
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl + bottomInset },
      ]}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={header ? <View style={styles.header}>{header}</View> : null}
      ListEmptyComponent={
        !enabled ? null : query.error ? (
          <View style={styles.state}>
            <FormBanner tone="error" message={toApiError(query.error).message} />
            <Button label="Try again" variant="secondary" onPress={() => void query.refetch()} />
          </View>
        ) : query.isPending ? (
          <ActivityIndicator color={colors.accent} />
        ) : typeof empty === "string" ? (
          <AppText variant="body" tone="tertiary" center>
            {empty}
          </AppText>
        ) : (
          (empty ?? null)
        )
      }
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={colors.accent} /> : null}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layoutSpacing.screenX,
  },
  header: {
    gap: layoutSpacing.sectionGap,
    marginBottom: layoutSpacing.sectionGap,
  },
  separator: {
    height: layoutSpacing.listGap,
  },
  state: {
    gap: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
