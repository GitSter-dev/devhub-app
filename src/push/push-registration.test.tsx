import { act, renderHook } from "@testing-library/react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Notifications from "expo-notifications";
import { Storage } from "expo-sqlite/kv-store";
import { http } from "msw";
import { Platform } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API, fail, ok, server } from "../../test/server";
import { signIn } from "../../test/signed-in";
import { installationId } from "./installation-id";
import { readPushPermission, requestPushPermission } from "./push-permission";
import { enablePush, isPushSupported, syncPushRegistration } from "./push-registration";
import { usePushState } from "./push-state";

function permission(status: string, canAskAgain: boolean) {
  return { status, canAskAgain, granted: status === "granted", expires: "never" } as never;
}

function registrations(respond: () => Response = () => ok({ id: "d1" })): unknown[] {
  const bodies: unknown[] = [];
  server.use(
    http.put(`${API}/devices/current`, async ({ request }) => {
      bodies.push(await request.json());
      return respond();
    }),
  );
  return bodies;
}

describe("push registration", () => {
  const originalOS = Platform.OS;

  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    Object.assign(Platform, { OS: "android" });
    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    await signIn();
  });

  afterEach(() => {
    Object.assign(Platform, { OS: originalOS });
  });

  it("maps the OS permission to granted, askable or blocked", async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce(permission("granted", false));
    await expect(readPushPermission()).resolves.toBe("granted");
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce(permission("denied", true));
    await expect(readPushPermission()).resolves.toBe("askable");
    vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce(permission("denied", false));
    await expect(requestPushPermission()).resolves.toBe("blocked");
  });

  it("supports push only in Android builds, not in Expo Go", () => {
    expect(isPushSupported()).toBe(true);

    Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
    expect(isPushSupported()).toBe(false);

    Constants.executionEnvironment = ExecutionEnvironment.Bare;
    Object.assign(Platform, { OS: "ios" });
    expect(isPushSupported()).toBe(false);
  });

  it("reports unsupported platforms without asking for anything", async () => {
    Object.assign(Platform, { OS: "ios" });
    const { result } = renderHook(() => usePushState());

    await act(() => syncPushRegistration());

    expect(result.current).toEqual({ status: "unsupported" });
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it("registers this device with its push token when permission is already granted", async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce(permission("granted", true));
    const bodies = registrations();
    const { result } = renderHook(() => usePushState());

    await act(() => syncPushRegistration());

    expect(result.current).toEqual({ status: "enabled" });
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith("activity", expect.anything());
    expect(bodies).toEqual([
      {
        installationId: installationId(),
        platform: "ANDROID",
        pushToken: "fcm-token",
        deviceName: "Test Phone",
        appVersion: "1.0.0",
      },
    ]);
  });

  it("waits for the user when permission has not been given", async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce(permission("undetermined", true));
    const bodies = registrations();
    const { result } = renderHook(() => usePushState());

    await act(() => syncPushRegistration());

    expect(result.current).toEqual({ status: "permission", permission: "askable" });
    expect(bodies).toEqual([]);
  });

  it("registers once the user allows notifications, or remembers the refusal", async () => {
    const bodies = registrations();
    const { result } = renderHook(() => usePushState());

    vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce(permission("denied", false));
    await act(() => enablePush());
    expect(result.current).toEqual({ status: "permission", permission: "blocked" });

    vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce(permission("granted", true));
    await act(() => enablePush());
    expect(result.current).toEqual({ status: "enabled" });
    expect(bodies).toHaveLength(1);
  });

  it("explains a server refusal, and hides unexpected failures behind a plain message", async () => {
    vi.mocked(Notifications.getPermissionsAsync).mockResolvedValue(permission("granted", true));
    const { result } = renderHook(() => usePushState());

    registrations(() => fail(429, "TOO_MANY_REQUESTS", "Slow down", { headers: { "Retry-After": "60" } }));
    await act(() => syncPushRegistration());
    expect(result.current).toEqual({ status: "failed", message: "Slow down" });

    vi.mocked(Notifications.getDevicePushTokenAsync).mockRejectedValueOnce(new Error("no FCM"));
    await act(() => syncPushRegistration());
    expect(result.current).toEqual({ status: "failed", message: "Push notifications aren't available in this build yet." });
  });

  it("keeps the same installation id for the life of the install", () => {
    const first = installationId();

    expect(installationId()).toBe(first);
    expect(Storage.getItemSync("devhub.push.installationId")).toBe(first);
  });
});
