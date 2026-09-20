import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/api-error";
import { searchPeople } from "@/api/people-api";
import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { FormBanner } from "@/components/form-banner";
import { ScreenHeader } from "@/components/screen-header";
import { TextField } from "@/components/text-field";
import { ConnectedPersonRow } from "@/features/people/connected-person-row";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { sessionManager } from "@/session/session-manager";
import { layoutSpacing, maxContentWidth, spacing, useThemeColors } from "@/theme";

const DEBOUNCE_MS = 250;

export default function SearchScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const query = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const results = useQuery({
    queryKey: ["people", "search", query.toLowerCase()],
    queryFn: ({ signal }) => searchPeople(sessionManager.client, query, signal),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
  });
  const people = query.length > 0 ? (results.data ?? []) : [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.backgroundCanvas }]}>
      <FlatList
        data={people}
        keyExtractor={(person) => person.id}
        renderItem={({ item }) => <ConnectedPersonRow person={item} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader title="Find developers" showBack={false} />
            <TextField
              label="Name or @username"
              value={text}
              onChangeText={setText}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              placeholder="ada, @ken_go, Grace…"
            />
          </View>
        }
        ListEmptyComponent={
          query.length === 0 ? (
            <AppText variant="body" tone="tertiary" center>
              Find developers by name or @username.
            </AppText>
          ) : results.error ? (
            <View style={styles.state}>
              <FormBanner tone="error" message={toApiError(results.error).message} />
              <Button label="Try again" variant="secondary" onPress={() => void results.refetch()} />
            </View>
          ) : results.isFetching ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <AppText variant="body" tone="tertiary" center>
              Nobody matches “{query}”.
            </AppText>
          )
        }
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
    gap: spacing.lg,
    marginBottom: layoutSpacing.sectionGap,
  },
  separator: {
    height: layoutSpacing.listGap,
  },
  state: {
    gap: spacing.md,
  },
});
