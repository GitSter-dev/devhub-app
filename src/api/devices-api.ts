import type { KyInstance } from "ky";

import { unwrap } from "./http-client";
import { idempotencyHeaders } from "./idempotency";

export type DevicePlatform = "ANDROID" | "IOS";

export type DeviceRegistration = {
  installationId: string;
  platform: DevicePlatform;
  pushToken: string;
  deviceName?: string;
  appVersion?: string;
};

export type RegisteredDevice = {
  id: string;
  installationId: string;
  platform: DevicePlatform;
  deviceName: string | null;
  appVersion: string | null;
  lastSeenAt: string;
};

export function registerDevice(client: KyInstance, registration: DeviceRegistration): Promise<RegisteredDevice> {
  return unwrap<RegisteredDevice>(client.put("devices/current", { json: registration }));
}

export function sendTestNotification(client: KyInstance, idempotencyKey: string): Promise<void> {
  return unwrap<void>(client.post("devices/current/test-notification", { headers: idempotencyHeaders(idempotencyKey) }));
}
