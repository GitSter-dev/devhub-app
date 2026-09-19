import { router } from "expo-router";

import type { NotificationType } from "@/api/notifications-api";
import { queryClient } from "@/api/query-client";
import type { CurrentUser } from "@/api/users-api";
import { lastUserStore } from "@/session/last-user-store";
import { currentUserQueryKey } from "@/session/use-session";

export type NotificationTarget = {
  type: NotificationType;
  subjectId: string | null;
  targetId: string | null;
  actorCount: number;
  actorUsername: string | null;
};

function openPost(id: string | null): void {
  if (id) router.push({ pathname: "/post/[id]", params: { id } });
}

function myUsername(): string | null {
  return queryClient.getQueryData<CurrentUser>(currentUserQueryKey)?.username ?? lastUserStore.read()?.username ?? null;
}

export function openNotification(target: NotificationTarget): void {
  const single = target.actorCount <= 1;
  switch (target.type) {
    case "POST_LIKED":
      openPost(target.subjectId);
      return;
    case "POST_REPLIED":
      openPost(single ? target.targetId : target.subjectId);
      return;
    case "NEW_FOLLOWER": {
      const me = myUsername();
      if (single && target.actorUsername) {
        router.push({ pathname: "/u/[username]", params: { username: target.actorUsername } });
      } else if (me) {
        router.push({ pathname: "/u/[username]/followers", params: { username: me } });
      }
      return;
    }
    case "FOLLOWED_POSTED":
      if (single) openPost(target.targetId);
      else router.navigate("/");
      return;
    case "MESSAGE_REQUEST":
      router.push({ pathname: "/messages", params: { tab: "requests" } });
      return;
  }
}

export function targetFromPush(data: Record<string, unknown>): NotificationTarget | null {
  const type = typeof data.type === "string" ? (data.type as NotificationType) : null;
  if (!type) return null;
  const text = (value: unknown) => (typeof value === "string" ? value : null);
  return {
    type,
    subjectId: text(data.subjectId),
    targetId: text(data.targetId),
    actorCount: Number(data.actorCount ?? 1) || 1,
    actorUsername: text(data.actorUsername),
  };
}
