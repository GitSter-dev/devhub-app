import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API, fail, ok, server } from "../../test/server";
import { tokenPair } from "../../test/tokens";

const REFRESH_KEY = "devhub.session.refreshToken";
const MARKER_KEY = "devhub.session.present";

async function load() {
  vi.resetModules();
  const secureStore = await import("expo-secure-store");
  const kv = await import("expo-sqlite/kv-store");
  const { sessionManager } = await import("./session-manager");
  return { sessionManager, secureStore, kv: kv.Storage };
}

function refreshRequests(respond: () => Response | Promise<Response>): { bodies: unknown[] } {
  const bodies: unknown[] = [];
  server.use(
    http.post(`${API}/auth/refresh`, async ({ request }) => {
      bodies.push(await request.json());
      return respond();
    }),
  );
  return { bodies };
}

describe("session manager", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("hydrate", () => {
    it("starts signed out on a fresh install", async () => {
      const { sessionManager } = await load();

      await sessionManager.hydrate();

      expect(sessionManager.store.get()).toEqual({ status: "signedOut" });
    });

    it("asks to sign in again when the token vanished but a session was expected", async () => {
      const { sessionManager, kv } = await load();
      kv.setItemSync(MARKER_KEY, "true");

      await sessionManager.hydrate();

      expect(sessionManager.store.get()).toEqual({ status: "reauthRequired", reason: "expired", message: null });
      expect(kv.getItemSync(MARKER_KEY)).toBeNull();
    });

    it("asks to sign in again when the keystore cannot be read", async () => {
      vi.useFakeTimers();
      const { sessionManager, secureStore } = await load();
      vi.mocked(secureStore.getItemAsync).mockRejectedValue(new Error("keystore locked"));

      const hydration = sessionManager.hydrate();
      await vi.runAllTimersAsync();
      await hydration;

      expect(secureStore.getItemAsync).toHaveBeenCalledTimes(4);
      expect(sessionManager.store.get()).toMatchObject({ status: "reauthRequired", reason: "expired" });
    });

    it("restores a stored session by rotating its refresh token", async () => {
      const { sessionManager, secureStore } = await load();
      await secureStore.setItemAsync(REFRESH_KEY, "stored-refresh");
      const requests = refreshRequests(() => ok(tokenPair("rotated")));

      await sessionManager.hydrate();

      expect(requests.bodies).toEqual([{ refreshToken: "stored-refresh" }]);
      expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: true });
      expect(await secureStore.getItemAsync(REFRESH_KEY)).toBe("rotated-refresh");
      await expect(sessionManager.currentAccessToken()).resolves.toBe("rotated-access");
    });

    it("opens the app offline instead of waiting forever for a slow refresh", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const { sessionManager, secureStore } = await load();
      await secureStore.setItemAsync(REFRESH_KEY, "stored-refresh");
      let release: (response: Response) => void = () => undefined;
      refreshRequests(() => new Promise<Response>((resolve) => (release = resolve)));

      const hydration = sessionManager.hydrate();
      await vi.advanceTimersByTimeAsync(4_000);
      await hydration;

      expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: false });
      release(ok(tokenPair("late")));
      await vi.waitFor(() => expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: true }));
    });

    it("hydrates only once however many times it is asked", async () => {
      const { sessionManager, secureStore } = await load();

      await Promise.all([sessionManager.hydrate(), sessionManager.hydrate()]);

      expect(secureStore.getItemAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe("refresh", () => {
    it("shares one refresh between concurrent callers", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a"));
      const requests = refreshRequests(() => ok(tokenPair("b")));

      const tokens = await Promise.all([sessionManager.refreshedAccessToken(), sessionManager.refreshedAccessToken()]);

      expect(tokens).toEqual(["b-access", "b-access"]);
      expect(requests.bodies).toHaveLength(1);
    });

    it("explains that another device took over when the session was replaced", async () => {
      const { sessionManager, secureStore } = await load();
      await sessionManager.startSession(tokenPair("a"));
      refreshRequests(() => fail(401, "SESSION_REPLACED", "You signed in on another device"));

      await expect(sessionManager.refreshedAccessToken()).resolves.toBeNull();

      expect(sessionManager.store.get()).toEqual({
        status: "reauthRequired",
        reason: "replaced",
        message: "You signed in on another device",
      });
      expect(await secureStore.getItemAsync(REFRESH_KEY)).toBeNull();
    });

    it("treats a rejected refresh token as an expired session", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a"));
      refreshRequests(() => fail(401, "INVALID_REFRESH_TOKEN"));

      await sessionManager.refreshedAccessToken();

      expect(sessionManager.store.get()).toEqual({ status: "reauthRequired", reason: "expired", message: null });
    });

    it("keeps the session but goes offline when the refresh fails for another reason", async () => {
      const { sessionManager, secureStore } = await load();
      await sessionManager.startSession(tokenPair("a"));
      refreshRequests(() => fail(400, "BAD_REQUEST"));

      await expect(sessionManager.refreshedAccessToken()).resolves.toBeNull();

      expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: false });
      expect(await secureStore.getItemAsync(REFRESH_KEY)).toBe("a-refresh");
    });

    it("returns nothing without a refresh token", async () => {
      const { sessionManager } = await load();

      await expect(sessionManager.refreshedAccessToken()).resolves.toBeNull();
    });
  });

  describe("access token", () => {
    it("reuses the current access token while it is comfortably valid", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a"));

      await expect(sessionManager.currentAccessToken()).resolves.toBe("a-access");
    });

    it("refreshes an access token that expires within the safety margin", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a", 10_000));
      refreshRequests(() => ok(tokenPair("b")));

      await expect(sessionManager.currentAccessToken()).resolves.toBe("b-access");
    });
  });

  describe("ending a session", () => {
    it("signs out locally even if the server cannot be told", async () => {
      const { sessionManager, secureStore, kv } = await load();
      await sessionManager.startSession(tokenPair("a"));
      let logoutBody: unknown = null;
      server.use(
        http.post(`${API}/auth/logout`, async ({ request }) => {
          logoutBody = await request.json();
          return fail(503, "INTERNAL_ERROR");
        }),
      );

      await sessionManager.signOut();

      expect(sessionManager.store.get()).toEqual({ status: "signedOut" });
      expect(await secureStore.getItemAsync(REFRESH_KEY)).toBeNull();
      expect(kv.getItemSync(MARKER_KEY)).toBeNull();
      await vi.waitFor(() => expect(logoutBody).toEqual({ refreshToken: "a-refresh" }));
    });

    it("ignores the server ending a session that is not signed in", async () => {
      const { sessionManager } = await load();
      await sessionManager.hydrate();

      await sessionManager.endSessionFromServer("replaced");

      expect(sessionManager.store.get()).toEqual({ status: "signedOut" });
    });

    it("lets the server end a live session", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a"));

      await sessionManager.endSessionFromServer("replaced");

      expect(sessionManager.store.get()).toEqual({ status: "reauthRequired", reason: "replaced", message: null });
      await expect(sessionManager.currentAccessToken()).resolves.toBeNull();
    });

    it("drops a pending re-auth prompt when the user chooses another account", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a"));
      await sessionManager.endSessionFromServer("expired");

      sessionManager.dismissReauth();

      expect(sessionManager.store.get()).toEqual({ status: "signedOut" });
    });
  });

  describe("connectivity", () => {
    it("publishes only real changes in connectivity", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a"));
      const listener = vi.fn();
      sessionManager.store.subscribe(listener);

      sessionManager.reportConnectivity(true);
      sessionManager.reportConnectivity(false);
      sessionManager.reportConnectivity(false);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: false });
    });

    it("retries the connection only while offline", async () => {
      const { sessionManager } = await load();
      await sessionManager.startSession(tokenPair("a"));
      const requests = refreshRequests(() => ok(tokenPair("b")));

      sessionManager.retryConnection();
      sessionManager.reportConnectivity(false);
      sessionManager.retryConnection();

      await vi.waitFor(() => expect(sessionManager.store.get()).toEqual({ status: "signedIn", online: true }));
      expect(requests.bodies).toHaveLength(1);
    });
  });
});
