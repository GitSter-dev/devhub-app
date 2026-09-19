import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import { fetchReplies, fetchThread } from "@/api/posts-api";
import { AppText } from "@/components/app-text";
import { FormBanner } from "@/components/form-banner";
import { ScreenHeader } from "@/components/screen-header";
import { PostCard } from "@/features/posts/post-card";
import { PostList } from "@/features/posts/post-list";
import { postKeys } from "@/features/posts/post-queries";
import { sessionManager } from "@/session/session-manager";
import { borderWidth, layoutSpacing, maxContentWidth, minTouchTarget, spacing, useThemeColors } from "@/theme";

const REPLY_BAR_HEIGHT = minTouchTarget + spacing.md * 2;

export default function ThreadScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = useQuery({
    queryKey: postKeys.thread(id),
    queryFn: () => fetchThread(sessionManager.client, id),
  });
  const post = thread.data?.post;

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <PostList
        queryKey={postKeys.replies(id)}
        fetchPage={(cursor) => fetchReplies(sessionManager.client, id, cursor)}
        enabled={Boolean(post)}
        onRefresh={() => thread.refetch()}
        bottomInset={REPLY_BAR_HEIGHT}
        empty="No replies yet. Start the conversation."
        header={
          <View style={styles.header}>
            <ScreenHeader title="Post" />
            {thread.error ? (
              <FormBanner
                tone="error"
                message={
                  toApiError(thread.error).code === "NOT_FOUND"
                    ? "This post doesn't exist."
                    : toApiError(thread.error).message
                }
              />
            ) : !thread.data ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <View style={styles.conversation}>
                {thread.data.ancestors.map((ancestor) => (
                  <View key={ancestor.id} style={styles.ancestor}>
                    <PostCard post={ancestor} />
                    <View style={[styles.connector, { backgroundColor: colors.borderStrong }]} />
                  </View>
                ))}
                <PostCard post={thread.data.post} focused />
                <AppText variant="overline" tone="accent" uppercase>
                  Replies
                </AppText>
              </View>
            )}
          </View>
        }
      />
      {post && !post.deleted && (
        <View
          style={[
            styles.replyBar,
            {
              paddingBottom: insets.bottom + spacing.md,
              backgroundColor: colors.backgroundCanvas,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/compose", params: { replyTo: post.id } })}
            style={[styles.replyField, { backgroundColor: colors.backgroundSunken, borderColor: colors.border }]}
          >
            <AppText variant="callout" tone="tertiary">
              Reply to @{post.author.username}
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: layoutSpacing.sectionGap,
  },
  conversation: {
    gap: spacing.md,
  },
  ancestor: {
    gap: spacing.xs,
  },
  connector: {
    width: borderWidth.thick,
    height: spacing.md,
    marginLeft: layoutSpacing.cardPadding + spacing.lg,
  },
  replyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingTop: spacing.md,
    paddingHorizontal: layoutSpacing.screenX,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyField: {
    width: "100%",
    maxWidth: maxContentWidth,
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: minTouchTarget / 2,
    borderWidth: 1,
  },
});
