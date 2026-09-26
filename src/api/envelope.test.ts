import { describe, expect, it } from "vitest";

import { isErrorEnvelope } from "./envelope";

describe("isErrorEnvelope", () => {
  it("recognises an error envelope by its string error code", () => {
    expect(isErrorEnvelope({ success: false, error: { code: "NOT_FOUND", message: "x" } })).toBe(true);
  });

  it("rejects anything without a string error code", () => {
    expect(isErrorEnvelope(null)).toBe(false);
    expect(isErrorEnvelope("NOT_FOUND")).toBe(false);
    expect(isErrorEnvelope({ success: true, data: {} })).toBe(false);
    expect(isErrorEnvelope({ error: {} })).toBe(false);
    expect(isErrorEnvelope({ error: { code: 404 } })).toBe(false);
  });
});
