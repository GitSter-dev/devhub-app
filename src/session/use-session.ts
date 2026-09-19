import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { isApiError } from "@/api/api-error";
import { fetchCurrentUser } from "@/api/users-api";
import { useStore } from "@/state/create-store";

import { lastUserStore } from "./last-user-store";
import { sessionManager, type SessionState } from "./session-manager";

export const currentUserQueryKey = ["users", "me"] as const;

export function useSessionState(): SessionState {
  return useStore(sessionManager.store);
}

export function useCurrentUser() {
  const state = useSessionState();
  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => fetchCurrentUser(sessionManager.client),
    enabled: state.status === "signedIn",
  });

  useEffect(() => {
    if (query.data) lastUserStore.write(query.data);
  }, [query.data]);

  useEffect(() => {
    if (isApiError(query.error) && query.error.code === "NOT_FOUND") {
      lastUserStore.clear();
      void sessionManager.signOut("account no longer exists");
    }
  }, [query.error]);

  return query;
}
