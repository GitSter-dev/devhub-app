import { useQuery } from "@tanstack/react-query";

import { fetchSuggestions } from "@/api/suggestions-api";
import { fetchMyTopics, fetchTopics } from "@/api/topics-api";
import { sessionManager } from "@/session/session-manager";

export const SUGGESTION_LIMIT = 20;

export const setupQueryKeys = {
  topics: ["topics"] as const,
  myTopics: ["users", "me", "topics"] as const,
  suggestions: ["users", "me", "suggestions"] as const,
};

export function useTopics() {
  return useQuery({ queryKey: setupQueryKeys.topics, queryFn: () => fetchTopics(sessionManager.client) });
}

export function useMyTopics() {
  return useQuery({ queryKey: setupQueryKeys.myTopics, queryFn: () => fetchMyTopics(sessionManager.client) });
}

export function useSuggestions() {
  return useQuery({
    queryKey: setupQueryKeys.suggestions,
    queryFn: () => fetchSuggestions(sessionManager.client, SUGGESTION_LIMIT),
  });
}
