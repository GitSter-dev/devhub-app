import { http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { updateRequiredStore } from "@/update/update-required";

import { API, fail, ok, server } from "../../test/server";
import { APP_PLATFORM_HEADER, APP_VERSION_HEADER } from "./client-identity";
import { createAuthedClient, publicClient } from "./http-client";

const tokenSource = {
  currentAccessToken: vi.fn(async () => "token"),
  refreshedAccessToken: vi.fn(async () => null),
  reportConnectivity: vi.fn(),
};

describe("client identity", () => {
  afterEach(() => updateRequiredStore.set(false));

  it("tells the backend which build is calling, signed in or not", async () => {
    const seen: [string | null, string | null][] = [];
    server.use(
      http.get(`${API}/thing`, ({ request }) => {
        seen.push([request.headers.get(APP_PLATFORM_HEADER), request.headers.get(APP_VERSION_HEADER)]);
        return ok(null);
      }),
    );

    await publicClient.get("thing");
    await createAuthedClient(tokenSource).get("thing");

    // Vitest runs on react-native-web, and the expo-application mock reports 1.0.0.
    expect(seen).toEqual([
      ["web", "1.0.0"],
      ["web", "1.0.0"],
    ]);
  });

  it("flags the build as outdated when the backend turns it away", async () => {
    server.use(http.post(`${API}/auth/login`, () => fail(426, "APP_UPDATE_REQUIRED")));

    await expect(publicClient.post("auth/login")).rejects.toMatchObject({ code: "APP_UPDATE_REQUIRED" });
    expect(updateRequiredStore.get()).toBe(true);
  });

  it("leaves the flag alone for any other error", async () => {
    server.use(http.get(`${API}/me`, () => fail(403, "ACCOUNT_BANNED")));

    await expect(createAuthedClient(tokenSource).get("me")).rejects.toMatchObject({ code: "ACCOUNT_BANNED" });
    expect(updateRequiredStore.get()).toBe(false);
  });
});
