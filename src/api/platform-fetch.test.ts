import { afterEach, describe, expect, it, vi } from "vitest";

import { platformFetch } from "./platform-fetch";

describe("platformFetch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the response untouched when fetch succeeds", async () => {
    const response = new Response("ok");
    vi.stubGlobal("fetch", vi.fn(async () => response));

    await expect(platformFetch("http://api.test/x")).resolves.toBe(response);
  });

  it("rewraps a native fetch failure as the standard network TypeError", async () => {
    const cause = new Error("FetchError: host unreachable");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(cause)));

    const error = await platformFetch("http://api.test/x").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TypeError);
    expect((error as TypeError).message).toBe("Network request failed");
    expect((error as TypeError).cause).toBe(cause);
  });

  it("keeps the original error when the request was aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(abort)));

    await expect(platformFetch("http://api.test/x", { signal: controller.signal })).rejects.toBe(abort);
  });

  it("reads the abort signal from a Request as well", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(abort)));

    await expect(platformFetch(new Request("http://api.test/x", { signal: controller.signal }))).rejects.toBe(abort);
  });
});
