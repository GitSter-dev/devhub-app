import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { API, fail, ok, server } from "../../test/server";
import { createAuthedClient, unwrap, type AccessTokenSource } from "./http-client";

function tokenSource(overrides: Partial<AccessTokenSource> = {}): AccessTokenSource & {
  reportConnectivity: ReturnType<typeof vi.fn>;
  refreshedAccessToken: ReturnType<typeof vi.fn>;
} {
  return {
    currentAccessToken: vi.fn(async () => "old-token"),
    refreshedAccessToken: vi.fn(async () => "new-token"),
    reportConnectivity: vi.fn(),
    ...overrides,
  } as never;
}

describe("authed client", () => {
  it("sends the current access token as a Bearer header", async () => {
    let authorization: string | null = null;
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        authorization = request.headers.get("Authorization");
        return ok({ id: "u1" });
      }),
    );

    const client = createAuthedClient(tokenSource());

    await expect(unwrap(client.get("me"))).resolves.toEqual({ id: "u1" });
    expect(authorization).toBe("Bearer old-token");
  });

  it("sends no Authorization header when there is no token", async () => {
    let authorization: string | null = "unset";
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        authorization = request.headers.get("Authorization");
        return ok({});
      }),
    );

    await createAuthedClient(tokenSource({ currentAccessToken: async () => null })).get("me").json();

    expect(authorization).toBeNull();
  });

  it("refreshes once on a 401 and replays the request with the new token", async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        seen.push(request.headers.get("Authorization"));
        return request.headers.get("Authorization") === "Bearer new-token"
          ? ok({ id: "u1" })
          : fail(401, "UNAUTHORIZED");
      }),
    );
    const source = tokenSource();

    await expect(unwrap(createAuthedClient(source).get("me"))).resolves.toEqual({ id: "u1" });

    expect(seen).toEqual(["Bearer old-token", "Bearer new-token"]);
    expect(source.refreshedAccessToken).toHaveBeenCalledTimes(1);
  });

  it("does not loop when the replay is rejected too", async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/me`, () => {
        calls++;
        return fail(401, "UNAUTHORIZED");
      }),
    );
    const source = tokenSource();

    await expect(createAuthedClient(source).get("me")).rejects.toMatchObject({ status: 401 });

    expect(calls).toBe(2);
    expect(source.refreshedAccessToken).toHaveBeenCalledTimes(1);
  });

  it("gives up without replaying when the refresh yields no token", async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/me`, () => {
        calls++;
        return fail(401, "UNAUTHORIZED");
      }),
    );

    await expect(
      createAuthedClient(tokenSource({ refreshedAccessToken: vi.fn(async () => null) })).get("me"),
    ).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
    expect(calls).toBe(1);
  });

  it("reports the server reachable on any response, even an error", async () => {
    server.use(http.get(`${API}/me`, () => fail(404, "NOT_FOUND")));
    const source = tokenSource();

    await createAuthedClient(source).get("me").catch(() => undefined);

    expect(source.reportConnectivity).toHaveBeenCalledWith(true);
    expect(source.reportConnectivity).not.toHaveBeenCalledWith(false);
  });

  it("reports the server unreachable on a network failure", async () => {
    server.use(http.get(`${API}/me`, () => HttpResponse.error()));
    const source = tokenSource();

    await expect(createAuthedClient(source).extend({ retry: 0 }).get("me")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(source.reportConnectivity).toHaveBeenCalledWith(false);
  });

  it("reports the server unreachable when a request times out", async () => {
    server.use(http.get(`${API}/me`, () => new Promise<Response>(() => {})));
    const source = tokenSource();

    await expect(createAuthedClient(source).extend({ retry: 0, timeout: 50 }).get("me")).rejects.toMatchObject({
      code: "TIMEOUT",
    });
    expect(source.reportConnectivity).toHaveBeenCalledWith(false);
  });
});
