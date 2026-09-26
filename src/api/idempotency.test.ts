import { describe, expect, it } from "vitest";

import { IDEMPOTENCY_HEADER, idempotencyHeaders, newIdempotencyKey } from "./idempotency";

describe("idempotency", () => {
  it("creates a fresh UUID for every key", () => {
    const first = newIdempotencyKey();

    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(newIdempotencyKey()).not.toBe(first);
  });

  it("sends the header only when there is a key", () => {
    expect(idempotencyHeaders("abc")).toEqual({ [IDEMPOTENCY_HEADER]: "abc" });
    expect(idempotencyHeaders(undefined)).toEqual({});
    expect(idempotencyHeaders("")).toEqual({});
  });
});
