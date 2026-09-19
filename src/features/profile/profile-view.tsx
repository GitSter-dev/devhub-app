import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { toApiError } from "@/api/api-error";
import { fetchUserPosts } from "@/api/posts-api";
import type { FollowList, Profile } from "@/api/profiles-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { Icon, type IconName } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { TopicChip } from "@/components/topic-chip";
import { haptics } from "@/feedback/haptics";
import { followSync, useFollowing } from "@/features/follows/follow-sync";
import { NotificationsCard } from "@/features/home/notifications-card";
import { FollowButton } from "@/features/people/person-row";
import { PostList } from "@/features/posts/post-list";
import { postKeys } from "@/features/posts/post-queries";
import { sessionManager } from "@/session/session-manager";
import {
  avatarSize,
  componentRadius,
  continuous,
  hitSlop,
  layoutSpacing,
  spacing,
  useTheme,
} from "@/theme";

import { useProfile } from "./profile-queries";

const joinedFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

type ProfileViewProps = {
  username: string;
  onOpenList?: (list: FollowList) => void;
  onEditProfile?: () => void;
  onEditStack?: () => void;
  showPosts?: boolean;
};

export function ProfileView({ username, onOpenList, onEditProfile, onEditStack, showPosts = false }: ProfileViewProps) {
  const profile = useProfile(username);

  return (
    <PostList
      queryKey={postKeys.byUser(username)}
      fetchPage={(cursor) => fetchUserPosts(sessionManager.client, username, cursor)}
      enabled={showPosts && Boolean(profile.data)}
      onRefresh={() => profile.refetch()}
      empty="No posts yet."
      header={
        <View style={styles.column}>
          <ScreenHeader title={profile.data ? `@${profile.data.username}` : undefined} />
          {profile.data ? (
            <ProfileBody
              profile={profile.data}
              onOpenList={onOpenList}
              onEditProfile={onEditProfile}
              onEditStack={onEditStack}
              showPosts={showPosts}
            />
          ) : profile.error ? (
            <View style={styles.state}>
              <FormBanner
                tone="error"
                message={
                  toApiError(profile.error).code === "NOT_FOUND"
                    ? "This developer doesn't exist or hasn't finished signing up."
                    : toApiError(profile.error).message
                }
              />
              <Button label="Try again" variant="secondary" onPress={() => void profile.refetch()} />
            </View>
          ) : (
            <ProfileSkeleton />
          )}
        </View>
      }
    />
  );
}

function ProfileSkeleton() {
  const { colors } = useTheme();
  return <View style={[styles.avatar, styles.skeleton, { backgroundColor: colors.backgroundSunken }]} />;
}

type ProfileBodyProps = Omit<ProfileViewProps, "username"> & { profile: Profile };

function ProfileBody({ profile, onOpenList, onEditProfile, onEditStack, showPosts }: ProfileBodyProps) {
  const { colors, shadows } = useTheme();
  const following = useFollowing().get(profile.id) ?? profile.following;
  const followerCount = profile.followerCount + (following ? 1 : 0) - (profile.following ? 1 : 0);

  useEffect(() => {
    if (!profile.me) followSync.seed(profile.id, profile.following);
  }, [profile.id, profile.me, profile.following]);

  return (
    <View style={styles.body}>
      <View
        style={[
          styles.card,
          continuous,
          { backgroundColor: colors.backgroundSurface, borderColor: colors.border, boxShadow: shadows.md },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
          <AppText variant="title1" tone="accent">
            {profile.displayName.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.identity}>
          <AppText variant="title2" center>
            {profile.displayName}
          </AppText>
          <View style={styles.handleRow}>
            <AppText variant="handle" tone="tertiary">
              @{profile.username}
            </AppText>
            {profile.followsYou && (
              <View style={[styles.badge, { backgroundColor: colors.backgroundSunken }]}>
                <AppText variant="caption" tone="secondary">
                  Follows you
                </AppText>
              </View>
            )}
          </View>
        </View>
        {profile.bio && (
          <AppText variant="body" tone="secondary" center>
            {profile.bio}
          </AppText>
        )}
        {(profile.githubUsername || profile.websiteUrl) && (
          <View style={styles.links}>
            {profile.githubUsername && (
              <LinkChip icon="code" label={`github.com/${profile.githubUsername}`} url={`https://github.com/${profile.githubUsername}`} />
            )}
            {profile.websiteUrl && (
              <LinkChip icon="link" label={profile.websiteUrl.replace(/^https:\/\//, "")} url={profile.websiteUrl} />
            )}
          </View>
        )}
        <View style={styles.counts}>
          <Count value={followerCount} label={followerCount === 1 ? "follower" : "followers"} onPress={onOpenList && (() => onOpenList("followers"))} />
          <Count value={profile.followingCount} label="following" onPress={onOpenList && (() => onOpenList("following"))} />
        </View>
        <AppText variant="footnote" tone="tertiary">
          Joined {joinedFormat.format(new Date(profile.joinedAt))}
        </AppText>
        {profile.me ? (
          <View style={styles.actions}>
            {onEditProfile && <Button label="Edit profile" variant="secondary" icon="edit" onPress={onEditProfile} />}
          </View>
        ) : (
          <View style={styles.actions}>
            <FollowButton
              wide
              following={following}
              name={profile.displayName}
              onPress={() => {
                haptics.selection();
                followSync.toggle(profile.id);
              }}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="overline" tone="accent" uppercase>
            Stack
          </AppText>
          {profile.me && onEditStack && (
            <Pressable accessibilityRole="button" hitSlop={hitSlop} onPress={onEditStack}>
              <AppText variant="subhead" tone="link">
                Edit
              </AppText>
            </Pressable>
          )}
        </View>
        {profile.topics.length > 0 ? (
          <View style={styles.chips}>
            {profile.topics.map((slug) => (
              <TopicChip key={slug} slug={slug} selected />
            ))}
          </View>
        ) : (
          <AppText variant="body" tone="tertiary">
            No topics yet.
          </AppText>
        )}
      </View>
      {profile.me && <NotificationsCard />}
      {showPosts && (
        <AppText variant="overline" tone="accent" uppercase>
          Posts
        </AppText>
      )}
    </View>
  );
}

function Count({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const content = (
    <AppText variant="subhead" tone="secondary">
      <AppText variant="headline">{value}</AppText> {label}
    </AppText>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${value} ${label}`} hitSlop={hitSlop} onPress={onPress}>
      {content}
    </Pressable>
  );
}

function LinkChip({ icon, label, url }: { icon: IconName; label: string; url: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void WebBrowser.openBrowserAsync(url)}
      style={[styles.link, { backgroundColor: colors.backgroundSunken, borderColor: colors.border }]}
    >
      <Icon name={icon} color={colors.textLink} size="sm" />
      <AppText variant="footnote" tone="link" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: layoutSpacing.sectionGap,
  },
  body: {
    gap: layoutSpacing.sectionGap,
  },
  card: {
    padding: layoutSpacing.cardPadding + spacing.xs,
    borderRadius: componentRadius.card,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: avatarSize.xl,
    height: avatarSize.xl,
    borderRadius: componentRadius.avatar,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skeleton: {
    alignSelf: "center",
    borderWidth: 0,
  },
  identity: {
    alignItems: "center",
    gap: spacing.xxs,
  },
  handleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: componentRadius.chip,
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: "100%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: componentRadius.chip,
    borderWidth: 1,
  },
  counts: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  actions: {
    alignSelf: "stretch",
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  state: {
    gap: spacing.md,
  },
});
