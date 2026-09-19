import type { ActivityNotification, NotificationType } from "@/api/notifications-api";

const ACTIONS: Record<NotificationType, string> = {
  POST_LIKED: "liked your post",
  POST_REPLIED: "replied to your post",
  NEW_FOLLOWER: "followed you",
  FOLLOWED_POSTED: "posted",
  MESSAGE_REQUEST: "wants to message you",
};

export function notificationWho(notification: ActivityNotification): string {
  const [first, second] = notification.actors.map((actor) => actor.displayName);
  const count = notification.actorCount;
  if (count <= 1 || !second) return first ?? "Someone";
  if (count === 2) return `${first} and ${second}`;
  const others = count - 2;
  return `${first}, ${second} and ${others} ${others === 1 ? "other" : "others"}`;
}

export function notificationAction(notification: ActivityNotification): string {
  return ACTIONS[notification.type];
}

export function notificationPreview(notification: ActivityNotification): string | null {
  if (notification.preview) return notification.preview;
  return notification.previewHasCode ? "Code snippet" : null;
}
