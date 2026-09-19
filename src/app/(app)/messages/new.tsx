import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import { chatApi } from "@/api/chat-api";
import { searchPeople } from "@/api/people-api";
import type { PersonSummary } from "@/api/profiles-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { Icon } from "@/components/icon";
import { ScreenHeader } from "@/components/screen-header";
import { TextField } from "@/components/text-field";
import { chatStore } from "@/chat/chat-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { sessionManager } from "@/session/session-manager";
import { avatarSize, componentRadius, layoutSpacing, maxContentWidth, minTouchTarget, spacing, useThemeColors } from "@/theme";

const GROUP_LIMIT = 49;

export default function NewMessageScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { addTo } = useLocalSearchParams<{ addTo?: string }>();
  const [grouping, setGrouping] = useState(Boolean(addTo));
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<ReadonlyMap<string, PersonSummary>>(new Map());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useDebouncedValue(text.trim(), 250);
  const results = useQuery({
    queryKey: ["people", "search", query.toLowerCase()],
    queryFn: ({ signal }) => searchPeople(sessionManager.client, query, signal),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
  });
  const people = query.length > 0 ? (results.data ?? []) : [];

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (failure) {
      setError(toApiError(failure).message);
    } finally {
      setBusy(false);
    }
  };

  const openDirect = (person: PersonSummary) =>
    run(async () => {
      const conversation = await chatApi.openDirect(sessionManager.client, person.id);
      await chatStore.saveConversations([conversation]);
      router.replace({ pathname: "/messages/[id]", params: { id: conversation.id } });
    });

  const toggle = (person: PersonSummary) =>
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(person.id)) next.delete(person.id);
      else if (next.size < GROUP_LIMIT) next.set(person.id, person);
      return next;
    });

  const finish = () =>
    run(async () => {
      const ids = [...selected.keys()];
      if (addTo) {
        await chatStore.saveConversations([await chatApi.addMembers(sessionManager.client, addTo, ids)]);
        router.back();
      } else {
        const group = await chatApi.createGroup(sessionManager.client, title.trim(), ids);
        await chatStore.saveConversations([group]);
        router.replace({ pathname: "/messages/[id]", params: { id: group.id } });
      }
    });

  const canFinish = selected.size > 0 && (Boolean(addTo) || title.trim().length > 0) && !busy;

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <FlatList
        data={people}
        keyExtractor={(person) => person.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
        renderItem={({ item }) => {
          const chosen = selected.has(item.id);
          return (
            <Pressable
              accessibilityRole={grouping ? "checkbox" : "button"}
              accessibilityState={grouping ? { checked: chosen } : undefined}
              accessibilityLabel={`${item.displayName}, @${item.username}`}
              disabled={busy}
              onPress={() => (grouping ? toggle(item) : void openDirect(item))}
              style={styles.person}
            >
              <View style={[styles.avatar, { backgroundColor: colors.backgroundAccentSubtle, borderColor: colors.borderAccentSubtle }]}>
                <AppText variant="headline" tone="accent">
                  {item.displayName.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {item.displayName}
                </AppText>
                <AppText variant="handle" tone="tertiary" numberOfLines={1}>
                  @{item.username}
                </AppText>
              </View>
              {grouping && (
                <View
                  style={[
                    styles.check,
                    { borderColor: chosen ? colors.accentSolid : colors.borderStrong, backgroundColor: chosen ? colors.accentSolid : "transparent" },
                  ]}
                >
                  {chosen && <Icon name="sent" color={colors.onAccentSolid} size="xs" />}
                </View>
              )}
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title={addTo ? "Add people" : grouping ? "New group" : "New message"} />
            {!addTo && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setGrouping((value) => !value)}
                style={[styles.modeToggle, { borderColor: colors.border, backgroundColor: colors.backgroundSurface }]}
              >
                <Icon name="group" color={colors.accent} size="sm" />
                <AppText variant="subhead" tone="accent">
                  {grouping ? "Back to a direct message" : "Create a group instead"}
                </AppText>
              </Pressable>
            )}
            {grouping && !addTo && (
              <TextField label="Group name" value={title} onChangeText={setTitle} maxLength={80} placeholder="Rust study group" />
            )}
            <TextField
              label="Find people"
              value={text}
              onChangeText={setText}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Name or @username"
            />
            {grouping && selected.size > 0 && (
              <AppText variant="footnote" tone="secondary">
                {[...selected.values()].map((person) => person.displayName).join(", ")}
              </AppText>
            )}
            {error && <FormBanner tone="error" message={error} />}
            {grouping && (
              <Button label={addTo ? "Add to group" : "Create group"} disabled={!canFinish} loading={busy} onPress={() => void finish()} />
            )}
          </View>
        }
        ListEmptyComponent={
          query.length > 0 && !results.isFetching ? (
            <AppText variant="body" tone="tertiary" center>
              Nobody matches “{query}”.
            </AppText>
          ) : null
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
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: componentRadius.chip,
    borderWidth: 1,
  },
  person: {
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
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
