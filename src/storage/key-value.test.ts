import { Storage } from "expo-sqlite/kv-store";
import { describe, expect, it, vi } from "vitest";

import { readValue, removeValue, writeValue } from "./key-value";

describe("key-value storage", () => {
  it("writes, reads and removes values", () => {
    writeValue("k", "v");
    expect(readValue("k")).toBe("v");

    removeValue("k");
    expect(readValue("k")).toBeNull();
  });

  it("treats a storage failure as a missing value instead of crashing the app", () => {
    vi.spyOn(Storage, "getItemSync").mockImplementation(() => {
      throw new Error("disk full");
    });
    vi.spyOn(Storage, "setItemSync").mockImplementation(() => {
      throw new Error("disk full");
    });
    vi.spyOn(Storage, "removeItemSync").mockImplementation(() => {
      throw new Error("disk full");
    });

    expect(readValue("k")).toBeNull();
    expect(() => writeValue("k", "v")).not.toThrow();
    expect(() => removeValue("k")).not.toThrow();
  });
});
