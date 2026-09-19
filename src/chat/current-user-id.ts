import { queryClient } from "@/api/query-client";
import type { CurrentUser } from "@/api/users-api";
import { currentUserQueryKey } from "@/session/use-session";

export function currentUserId(): string | null {
  return queryClient.getQueryData<CurrentUser>(currentUserQueryKey)?.id ?? null;
}
