import { describe, expect, it, vi } from "vitest";

import { createStore } from "./create-store";

describe("createStore", () => {
  it("notifies subscribers on every set until they unsubscribe", () => {
    const store = createStore(1);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set(2);
    unsubscribe();
    store.set(3);

    expect(store.get()).toBe(3);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
