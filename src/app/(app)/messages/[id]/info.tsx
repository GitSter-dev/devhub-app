import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import { chatApi, type ChatMember } from "@/api/chat-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { ScreenHeader } from "@/components/screen-header";
import { TextField } from "@/components/text-field";
import { useConversation } from "@/chat/chat-queries";
import { chatStore } from "@/chat/chat-store";
import { chatSync } from "@/chat/chat-sync";
import { useCurrentUserId } from "@/chat/current-user-id";
import { sessionManager } from "@/session/session-manager";
import { avatarSize, componentRadius, hitSlop, layoutSpacing, maxContentWidth, minTouchTarget, spacing, useThemeColors } from "@/theme";

export default function GroupInfoScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useCurrentUserId();
  const conversation = useConversation(id).data ?? null;
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!conversation) return <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]} />;

  const owner = conversation.members.some((member) => member.id === myId && member.role === "OWNER");
  const draftTitle = title ?? conversation.title ?? "";

  const attempt = (task: () => Promise<void>) => {
    setError(null);
    task().catch((failure) => setError(toApiError(failure).message));
  };

  const rename = () =>
    attempt(async () => {
      await chatStore.saveConversations([await chatApi.rename(sessionManager.client, id, draftTitle.trim())]);
      setTitle(null);
    });

  const remove = (member: ChatMember) =>
    Alert.alert(`Remove ${member.displayName}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          attempt(async () => {
            await chatApi.removeMember(sessionManager.client, id, member.id);
            await chatSync.syncConversation(id);
          }),
      },
    ]);

  const leave = () =>
    Alert.alert("Leave this group?", "You'll stop getting its messages.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () =>
          attempt(async () => {
            if (myId) await chatApi.removeMember(sessionManager.client, id, myId);
            await chatStore.removeConversation(id);
            router.dismissTo("/messages");
          }),
      },
    ]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <FlatList
        data={conversation.members}
        keyExtractor={(member) => member.id}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
        renderItem={({ item }) => (
          <View style={styles.member}>
            <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
              <AppText variant="headline" tone="accent">
                {item.displayName.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {item.id === myId ? `${item.displayName} (you)` : item.displayName}
              </AppText>
              <AppText variant="handle" tone="tertiary" numberOfLines={1}>
                @{item.username}
                {item.role === "OWNER" ? " · owner" : ""}
              </AppText>
            </View>
            {owner && item.id !== myId && (
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.displayName}`} hitSlop={hitSlop} onPress={() => remove(item)}>
                <AppText variant="subhead" tone="danger">
                  Remove
                </AppText>
              </Pressable>
            )}
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title="Group info" />
            {error && <FormBanner tone="error" message={error} />}
            {owner ? (
              <View style={styles.rename}>
                <TextField label="Group name" value={draftTitle} onChangeText={setTitle} maxLength={80} />
                <Button
                  label="Save name"
                  variant="secondary"
                  disabled={draftTitle.trim() === "" || draftTitle.trim() === conversation.title}
                  onPress={rename}
                />
              </View>
            ) : (
              <AppText variant="title2">{conversation.title}</AppText>
            )}
            <View style={styles.sectionHeader}>
              <AppText variant="overline" tone="accent" uppercase>
                {conversation.members.length} members
              </AppText>
              {owner && (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={hitSlop}
                  onPress={() => router.push({ pathname: "/messages/new", params: { addTo: id } })}
                >
                  <AppText variant="subhead" tone="link">
                    Add people
                  </AppText>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button label="Leave group" variant="secondary" onPress={leave} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layoutSpacing.screenX,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  rename: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: minTouchTarget + spacing.md,
  },
  avatar: {
    width: avatarSize.md,
    height: avatarSize.md,
    borderRadius: componentRadius.avatar,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
