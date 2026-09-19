import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";

import { toApiError } from "@/api/api-error";
import { createPost, fetchThread, type Post, type PostPage } from "@/api/posts-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { FormTextField } from "@/components/form-text-field";
import { Icon } from "@/components/icon";
import { KeyboardScreen } from "@/components/keyboard-screen";
import { ScreenHeader } from "@/components/screen-header";
import { haptics } from "@/feedback/haptics";
import { applyServerFieldErrors } from "@/features/auth/apply-server-errors";
import { postKeys } from "@/features/posts/post-queries";
import { postSchema, type PostInput, type PostValues } from "@/schemas/postSchema";
import { sessionManager } from "@/session/session-manager";
import { useIdempotencyKey } from "@/session/use-idempotency-key";
import { componentRadius, hitSlop, spacing, useThemeColors } from "@/theme";

const BODY_LIMIT = 500;
const FIELDS = ["body", "code", "codeLanguage"] as const;

export default function ComposeScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { replyTo } = useLocalSearchParams<{ replyTo?: string }>();
  const { keyFor, rotate } = useIdempotencyKey();
  const [withCode, setWithCode] = useState(false);
  const parent = useQuery({
    queryKey: postKeys.thread(replyTo ?? ""),
    queryFn: () => fetchThread(sessionManager.client, replyTo ?? ""),
    enabled: Boolean(replyTo),
    select: (thread) => thread.post,
  });
  const { control, handleSubmit, setError } = useForm<PostInput, unknown, PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { body: "", code: "", codeLanguage: "" },
  });
  const body = useWatch({ control, name: "body" });
  const code = useWatch({ control, name: "code" });

  const publish = useMutation({
    mutationFn: (values: PostValues) => {
      const post = { ...values, replyToId: replyTo ?? null };
      return createPost(sessionManager.client, post, keyFor(post));
    },
    onSuccess: (post) => {
      haptics.success();
      rotate();
      if (post.replyToId) {
        void queryClient.invalidateQueries({ queryKey: postKeys.all });
      } else {
        queryClient.setQueryData<InfiniteData<PostPage>>(postKeys.feed, (feed) => prepend(feed, post));
        void queryClient.invalidateQueries({ queryKey: postKeys.byUser(post.author.username) });
      }
      router.back();
    },
    onError: (error) => {
      haptics.error();
      applyServerFieldErrors(toApiError(error), setError, FIELDS, {});
    },
  });

  const serverError =
    publish.error && Object.keys(toApiError(publish.error).fieldErrors).length === 0 ? toApiError(publish.error) : null;
  const empty = body.trim() === "" && code.trim() === "";

  return (
    <KeyboardScreen>
      <View style={styles.page}>
        <ScreenHeader
          title={replyTo ? "Reply" : "New post"}
          right={
            <Button
              label="Post"
              disabled={empty}
              loading={publish.isPending}
              onPress={handleSubmit((values) => publish.mutate(values))}
            />
          }
        />
        {replyTo && parent.data && (
          <View style={[styles.parent, { borderLeftColor: colors.borderAccentSubtle }]}>
            <AppText variant="footnote" tone="tertiary">
              Replying to @{parent.data.author.username}
            </AppText>
            {parent.data.body && (
              <AppText variant="callout" tone="secondary" numberOfLines={3}>
                {parent.data.body}
              </AppText>
            )}
          </View>
        )}
        {serverError && <FormBanner tone="error" message={serverError.message} />}
        <FormTextField
          control={control}
          name="body"
          label={replyTo ? "Your reply" : "What are you building?"}
          multiline
          autoFocus
          maxLength={BODY_LIMIT}
          hint={`${body.length} / ${BODY_LIMIT}`}
        />
        {withCode ? (
          <View style={styles.code}>
            <FormTextField
              control={control}
              name="code"
              label="Code"
              multiline
              mono
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={4000}
            />
            <FormTextField
              control={control}
              name="codeLanguage"
              label="Language"
              placeholder="typescript, rust, go…"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a code block"
            hitSlop={hitSlop}
            onPress={() => setWithCode(true)}
            style={[styles.addCode, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
          >
            <Icon name="code" color={colors.accent} size="sm" />
            <AppText variant="subhead" tone="accent">
              Add a code block
            </AppText>
          </Pressable>
        )}
      </View>
    </KeyboardScreen>
  );
}

function prepend(feed: InfiniteData<PostPage> | undefined, post: Post): InfiniteData<PostPage> | undefined {
  if (!feed || feed.pages.length === 0) return feed;
  const [first, ...rest] = feed.pages;
  return { ...feed, pages: [{ ...first, items: [post, ...first.items] }, ...rest] };
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  parent: {
    gap: spacing.xs,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
  },
  code: {
    gap: spacing.lg,
  },
  addCode: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: componentRadius.chip,
    borderWidth: 1,
  },
});
