import { describe, expect, it } from "vitest";

import { reauthMessage } from "./reauth-copy";

describe("reauthMessage", () => {
  it("explains an expired session", () => {
    expect(reauthMessage({ status: "reauthRequired", reason: "expired", message: null })).toMatch(/expired/);
  });

  it("prefers the server's own words when another device took over", () => {
    expect(reauthMessage({ status: "reauthRequired", reason: "replaced", message: "Signed in on a Pixel" })).toBe(
      "Signed in on a Pixel",
    );
    expect(reauthMessage({ status: "reauthRequired", reason: "replaced", message: null })).toMatch(/another device/);
  });

  it("says nothing outside a re-auth prompt", () => {
    expect(reauthMessage({ status: "signedOut" })).toBeNull();
    expect(reauthMessage({ status: "signedIn", online: true })).toBeNull();
  });
});
