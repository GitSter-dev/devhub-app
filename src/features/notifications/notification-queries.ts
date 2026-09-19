import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { notificationsApi } from "@/api/notifications-api";
import { queryClient } from "@/api/query-client";
import { sessionManager } from "@/session/session-manager";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  unseen: ["notifications", "unseen"] as const,
};

export function useUnseenNotifications(): number {
  return (
    useQuery({
      queryKey: notificationKeys.unseen,
      queryFn: () => notificationsApi.unseenCount(sessionManager.client),
    }).data ?? 0
  );
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => notificationsApi.list(sessionManager.client, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  });
}

export function refreshNotifications(): void {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export async function markNotificationsSeen(until: string): Promise<void> {
  const unseen = await notificationsApi.markSeen(sessionManager.client, until);
  queryClient.setQueryData(notificationKeys.unseen, unseen);
}
