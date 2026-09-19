import type { KyInstance } from "ky";

import { unwrap } from "./http-client";

export type NotificationType = "POST_LIKED" | "POST_REPLIED" | "NEW_FOLLOWER" | "FOLLOWED_POSTED" | "MESSAGE_REQUEST";

export type NotificationActor = { id: string; username: string; displayName: string };

export type ActivityNotification = {
  id: string;
  type: NotificationType;
  actors: NotificationActor[];
  actorCount: number;
  subjectId: string | null;
  targetId: string | null;
  preview: string | null;
  previewHasCode: boolean;
  updatedAt: string;
  seen: boolean;
};

export type NotificationPage = { items: ActivityNotification[]; nextCursor: string | null };

export const notificationsApi = {
  list: (client: KyInstance, cursor: string | null) =>
    unwrap<NotificationPage>(client.get("notifications", { searchParams: cursor ? { cursor } : {} })),
  unseenCount: (client: KyInstance) =>
    unwrap<{ count: number }>(client.get("notifications/unseen-count")).then((result) => result.count),
  markSeen: (client: KyInstance, until: string) =>
    unwrap<{ count: number }>(client.post("notifications/seen", { json: { until } })).then((result) => result.count),
};
