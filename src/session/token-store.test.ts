import * as SecureStore from "expo-secure-store";
import { afterEach, describe, expect, it, vi } from "vitest";

import { tokenStore } from "./token-store";

describe("token store", () => {
  afterEach(() => vi.useRealTimers());

  it("reports a stored token, or that there is none", async () => {
    await expect(tokenStore.read()).resolves.toEqual({ kind: "missing" });

    await tokenStore.write("refresh-1");

    await expect(tokenStore.read()).resolves.toEqual({ kind: "found", token: "refresh-1" });
  });

  it("rides out a briefly locked keystore", async () => {
    vi.useFakeTimers();
    vi.mocked(SecureStore.getItemAsync)
      .mockRejectedValueOnce(new Error("locked"))
      .mockRejectedValueOnce(new Error("locked"))
      .mockResolvedValueOnce("refresh-1");

    const read = tokenStore.read();
    await vi.advanceTimersByTimeAsync(150 + 300);

    await expect(read).resolves.toEqual({ kind: "found", token: "refresh-1" });
  });

  it("gives up after three retries and says why", async () => {
    vi.useFakeTimers();
    const failure = new Error("keystore gone");
    vi.mocked(SecureStore.getItemAsync).mockRejectedValue(failure);

    const read = tokenStore.read();
    await vi.advanceTimersByTimeAsync(150 + 300 + 600);

    await expect(read).resolves.toEqual({ kind: "error", error: failure });
    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(4);
  });

  it("never fails when clearing", async () => {
    vi.useFakeTimers();
    vi.mocked(SecureStore.deleteItemAsync).mockRejectedValue(new Error("nope"));

    const clear = tokenStore.clear();
    await vi.runAllTimersAsync();

    await expect(clear).resolves.toBeUndefined();
  });
});
