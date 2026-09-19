import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { Post } from "@/api/posts-api";
import type { SheetAction } from "@/components/action-sheet";
import { actionSheet } from "@/components/action-sheet-host";
import { AppText } from "@/components/app-text";
import { Icon } from "@/components/icon";
import { PressableScale } from "@/components/pressable-scale";
import { confirmBlock } from "@/moderation/block-actions";
import { reportFlow } from "@/moderation/report-store";
import { avatarSize, componentRadius, continuous, hitSlop, layoutSpacing, spacing, useTheme } from "@/theme";

import { CodeBlock } from "./code-block";
import { LikeControl } from "./like-control";
import { likeSync, useLikes } from "./like-sync";
import { relativeTime } from "./relative-time";

import { useDeletePost } from "./use-delete-post";

function postActions(post: Post, confirmDelete: (postId: string) => void): SheetAction[] {
  if (post.mine) {
    return [{ label: "Delete post", destructive: true, onPress: () => confirmDelete(post.id) }];
  }
  return [
    {
      label: "Report post",
      destructive: true,
      onPress: () =>
        reportFlow.open({ type: "POST", id: post.id, username: post.author.username, userId: post.author.id }),
    },
    {
      label: `Block @${post.author.username}`,
      destructive: true,
      onPress: () => confirmBlock(post.author.id, post.author.username),
    },
  ];
}


type PostCardProps = {
  post: Post;
  focused?: boolean;
  onOpen?: () => void;
};

export function PostCard({ post, focused = false, onOpen }: PostCardProps) {
  const { colors } = useTheme();
  const liked = useLikes().get(post.id) ?? post.liked;
  const likeCount = post.likeCount + (liked ? 1 : 0) - (post.liked ? 1 : 0);
  const confirmDelete = useDeletePost();
  const open = onOpen ?? (() => router.push({ pathname: "/post/[id]", params: { id: post.id } }));

  useEffect(() => {
    if (!post.deleted) likeSync.seed(post.id, post.liked);
  }, [post.id, post.liked, post.deleted]);

  if (post.deleted) {
    return (
      <PressableScale
        haptic={false}
        accessibilityRole="button"
        accessibilityLabel="This post was deleted"
        onPress={open}
        style={[styles.card, styles.deleted, continuous, { backgroundColor: colors.backgroundSunken, borderColor: colors.border }]}
      >
        <AppText variant="footnote" tone="tertiary">
          This post was deleted
        </AppText>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      haptic={false}
      accessibilityRole="button"
      accessibilityHint="Opens the conversation"
      disabled={focused}
      onPress={open}
      style={[
        styles.card,
        continuous,
        { backgroundColor: colors.backgroundSurface, borderColor: focused ? colors.borderAccentSubtle : colors.border },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${post.author.displayName}, @${post.author.username}`}
          hitSlop={hitSlop}
          onPress={() => router.push({ pathname: "/u/[username]", params: { username: post.author.username } })}
          style={styles.author}
        >
          <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
            <AppText variant="headline" tone="accent">
              {post.author.displayName.charAt(0).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.names}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {post.author.displayName}
            </AppText>
            <AppText variant="handle" tone="tertiary" numberOfLines={1}>
              @{post.author.username} · {relativeTime(post.createdAt)}
            </AppText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post options"
          hitSlop={hitSlop}
          onPress={() => actionSheet.open(postActions(post, confirmDelete))}
        >
          <Icon name="more" color={colors.textTertiary} size="sm" />
        </Pressable>
      </View>

      {post.replyToId && (
        <AppText variant="footnote" tone="tertiary">
          {post.replyToDeleted ? "Replying to a deleted post" : `Replying to @${post.replyToUsername}`}
        </AppText>
      )}
      {(post.removed || post.underReview) && (
        <AppText variant="footnote" tone="warning">
          {post.removed
            ? "Removed for breaking the community guidelines. Only you can see it."
            : "Under review after reports. Only you can see it until a moderator decides."}
        </AppText>
      )}
      {post.body && (
        <AppText variant={focused ? "body" : "callout"} selectable={focused}>
          {post.body}
        </AppText>
      )}
      {post.code && <CodeBlock code={post.code} language={post.codeLanguage} />}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reply, ${post.replyCount} ${post.replyCount === 1 ? "reply" : "replies"}`}
          hitSlop={hitSlop}
          onPress={() => router.push({ pathname: "/compose", params: { replyTo: post.id } })}
          style={styles.action}
        >
          <Icon name="reply" color={colors.textTertiary} size="sm" />
          <AppText variant="metric" tone="tertiary">
            {post.replyCount}
          </AppText>
        </Pressable>
        <LikeControl liked={liked} count={likeCount} onToggle={() => likeSync.toggle(post.id)} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: layoutSpacing.cardPadding,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    gap: spacing.sm,
  },
  deleted: {
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  author: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: avatarSize.md,
    height: avatarSize.md,
    borderRadius: componentRadius.avatar,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  names: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xl,
    paddingTop: spacing.xs,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
