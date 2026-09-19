import * as Notifications from "expo-notifications";

export type PushPermission = "granted" | "askable" | "blocked";

function toPermission({ status, canAskAgain }: Notifications.NotificationPermissionsStatus): PushPermission {
  if (status === "granted") return "granted";
  return canAskAgain ? "askable" : "blocked";
}

export async function readPushPermission(): Promise<PushPermission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

export async function requestPushPermission(): Promise<PushPermission> {
  return toPermission(await Notifications.requestPermissionsAsync());
}
