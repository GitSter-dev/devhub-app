import * as Application from "expo-application";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { toApiError } from "@/api/api-error";
import { registerDevice } from "@/api/devices-api";
import { sessionManager } from "@/session/session-manager";

import { installationId } from "./installation-id";
import { ensureNotificationChannel } from "./notification-setup";
import { readPushPermission, requestPushPermission } from "./push-permission";
import { setPushState } from "./push-state";

const UNAVAILABLE_MESSAGE = "Push notifications aren't available in this build yet.";

export function isPushSupported(): boolean {
  return Platform.OS === "android" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

export async function registerCurrentDevice(pushToken?: string): Promise<void> {
  setPushState({ status: "registering" });
  try {
    await ensureNotificationChannel();
    const token = pushToken ?? String((await Notifications.getDevicePushTokenAsync()).data);
    await registerDevice(sessionManager.client, {
      installationId: installationId(),
      platform: "ANDROID",
      pushToken: token,
      deviceName: Device.modelName ?? undefined,
      appVersion: Application.nativeApplicationVersion ?? undefined,
    });
    setPushState({ status: "enabled" });
  } catch (error) {
    const apiError = toApiError(error);
    const message = apiError.code === "UNEXPECTED" ? UNAVAILABLE_MESSAGE : apiError.message;
    setPushState({ status: "failed", message });
  }
}

export async function syncPushRegistration(): Promise<void> {
  if (!isPushSupported()) {
    setPushState({ status: "unsupported" });
    return;
  }
  const permission = await readPushPermission();
  if (permission === "granted") {
    await registerCurrentDevice();
  } else {
    setPushState({ status: "permission", permission });
  }
}

export async function enablePush(): Promise<void> {
  const permission = await requestPushPermission();
  if (permission === "granted") {
    await registerCurrentDevice();
  } else {
    setPushState({ status: "permission", permission });
  }
}
