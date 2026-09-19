import { queryClient } from "@/api/query-client";
import type { CurrentUser } from "@/api/users-api";
import { lastUserStore } from "@/session/last-user-store";
import { currentUserQueryKey, useCurrentUser } from "@/session/use-session";

export function currentUserId(): string | null {
  return queryClient.getQueryData<CurrentUser>(currentUserQueryKey)?.id ?? lastUserStore.read()?.id ?? null;
}

export function useCurrentUserId(): string | null {
  return useCurrentUser().data?.id ?? lastUserStore.read()?.id ?? null;
}
