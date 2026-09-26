import { vi } from "vitest";

export const AndroidImportance = { DEFAULT: 3, HIGH: 4, MAX: 5 } as const;

export const setNotificationHandler = vi.fn();
export const setNotificationChannelAsync = vi.fn(async () => null);
export const getPermissionsAsync = vi.fn(async () => ({ status: "undetermined", granted: false, canAskAgain: true }));
export const requestPermissionsAsync = vi.fn(async () => ({ status: "granted", granted: true, canAskAgain: true }));
export const getDevicePushTokenAsync = vi.fn(async () => ({ type: "android", data: "fcm-token" }));
export const getLastNotificationResponseAsync = vi.fn(async () => null);
export const addPushTokenListener = vi.fn(() => ({ remove: vi.fn() }));
export const addNotificationResponseReceivedListener = vi.fn(() => ({ remove: vi.fn() }));
