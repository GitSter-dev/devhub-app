import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/api-error";

import { ToggleSync } from "./toggle-sync";

function setup() {
  const turnOn = vi.fn(async (_id: string) => undefined);
  const turnOff = vi.fn(async (_id: string) => undefined);
  const sync = new ToggleSync({ turnOn, turnOff });
  return { sync, turnOn, turnOff, state: (id: string) => sync.store.get().get(id) };
}

function deferred(): { promise: Promise<undefined>; resolve: () => void; reject: (error: Error) => void } {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<undefined>((res, rej) => {
    resolve = () => res(undefined);
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ToggleSync", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the new state at once and sends it after the taps settle", async () => {
    const { sync, turnOn, state } = setup();

    sync.toggle("p1");

    expect(state("p1")).toBe(true);
    await vi.advanceTimersByTimeAsync(599);
    expect(turnOn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(turnOn).toHaveBeenCalledWith("p1");
  });

  it("sends nothing when a double tap lands back where it started", async () => {
    const { sync, turnOn, turnOff, state } = setup();

    sync.toggle("p1");
    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(1_000);

    expect(state("p1")).toBe(false);
    expect(turnOn).not.toHaveBeenCalled();
    expect(turnOff).not.toHaveBeenCalled();
  });

  it("restarts the settle window on every tap and sends only the final state", async () => {
    const { sync, turnOn, turnOff } = setup();

    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(400);
    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(400);
    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600);

    expect(turnOn).toHaveBeenCalledTimes(1);
    expect(turnOff).not.toHaveBeenCalled();
  });

  it("takes server state as the starting point until the user touches it", () => {
    const { sync, state } = setup();

    sync.seed("p1", true);
    expect(state("p1")).toBe(true);

    sync.toggle("p1");
    sync.seed("p1", true);

    expect(state("p1")).toBe(false);
  });

  it("does not let stale server data overwrite a confirmed toggle", async () => {
    const { sync, state } = setup();
    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600);

    sync.seed("p1", false);

    expect(state("p1")).toBe(true);
  });

  it("sends a change made while a request is in flight once that request finishes", async () => {
    const { sync, turnOn, turnOff } = setup();
    const inFlight = deferred();
    turnOn.mockReturnValueOnce(inFlight.promise);
    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600);
    expect(turnOn).toHaveBeenCalledTimes(1);

    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600);
    expect(turnOff).not.toHaveBeenCalled();

    inFlight.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(turnOff).toHaveBeenCalledWith("p1");
  });

  it("retries temporary failures with exponential backoff", async () => {
    const { sync, turnOn } = setup();
    turnOn
      .mockRejectedValueOnce(new ApiError(503, "INTERNAL_ERROR", "down"))
      .mockRejectedValueOnce(ApiError.network())
      .mockResolvedValueOnce(undefined);

    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600);
    expect(turnOn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(turnOn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3_999);
    expect(turnOn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(turnOn).toHaveBeenCalledTimes(3);
    expect(sync.store.get().get("p1")).toBe(true);
  });

  it("waits as long as the server's Retry-After asks", async () => {
    const { sync, turnOn } = setup();
    turnOn.mockRejectedValueOnce(new ApiError(429, "TOO_MANY_REQUESTS", "slow", {}, 30));

    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600 + 29_999);
    expect(turnOn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(turnOn).toHaveBeenCalledTimes(2);
  });

  it("gives up after five retries and shows what the server has", async () => {
    const { sync, turnOn, state } = setup();
    turnOn.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "down"));

    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600);
    await vi.advanceTimersByTimeAsync(2_000 + 4_000 + 8_000 + 16_000 + 32_000);

    expect(turnOn).toHaveBeenCalledTimes(6);
    expect(state("p1")).toBe(false);
  });

  it("reverts immediately when the server refuses the change", async () => {
    const { sync, turnOn, state } = setup();
    turnOn.mockRejectedValueOnce(new ApiError(403, "FORBIDDEN", "blocked"));

    sync.toggle("p1");
    expect(state("p1")).toBe(true);
    await vi.advanceTimersByTimeAsync(600);

    expect(state("p1")).toBe(false);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(turnOn).toHaveBeenCalledTimes(1);
  });

  it("stops retrying something it was told to forget", async () => {
    const { sync, turnOn, state } = setup();
    turnOn.mockRejectedValue(new ApiError(503, "INTERNAL_ERROR", "down"));

    sync.toggle("p1");
    await vi.advanceTimersByTimeAsync(600);
    sync.forget("p1");
    await vi.advanceTimersByTimeAsync(120_000);

    expect(turnOn).toHaveBeenCalledTimes(1);
    expect(state("p1")).toBeUndefined();
  });

  it("drops everything pending on reset", async () => {
    const { sync, turnOn } = setup();
    sync.toggle("p1");
    sync.toggle("p2");

    sync.reset();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(turnOn).not.toHaveBeenCalled();
    expect(sync.store.get().size).toBe(0);
  });

  it("tracks each item independently", async () => {
    const { sync, turnOn, turnOff } = setup();
    sync.seed("p2", true);

    sync.toggle("p1");
    sync.toggle("p2");
    await vi.advanceTimersByTimeAsync(600);

    expect(turnOn).toHaveBeenCalledWith("p1");
    expect(turnOff).toHaveBeenCalledWith("p2");
  });
});
