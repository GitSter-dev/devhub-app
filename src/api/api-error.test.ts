import { describe, expect, it } from "vitest";

import { ApiError, isApiError, toApiError } from "./api-error";

describe("ApiError", () => {
  it("builds client-side errors with their own codes and copy", () => {
    expect(ApiError.network()).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
    expect(ApiError.timeout()).toMatchObject({ status: 0, code: "TIMEOUT" });
    expect(ApiError.unexpected(502)).toMatchObject({ status: 502, code: "UNEXPECTED" });
    expect(ApiError.network().message).toMatch(/offline/);
  });

  it("treats only network failures and timeouts as connectivity problems", () => {
    expect(ApiError.network().isConnectivity).toBe(true);
    expect(ApiError.timeout().isConnectivity).toBe(true);
    expect(ApiError.unexpected(500).isConnectivity).toBe(false);
    expect(new ApiError(401, "UNAUTHORIZED", "no").isConnectivity).toBe(false);
  });

  it("defaults field errors to empty and Retry-After to unknown", () => {
    const error = new ApiError(400, "VALIDATION_FAILED", "bad");

    expect(error.fieldErrors).toEqual({});
    expect(error.retryAfterSeconds).toBeNull();
  });

  it("passes ApiErrors through and wraps anything else as unexpected", () => {
    const original = new ApiError(409, "EMAIL_TAKEN", "taken");

    expect(toApiError(original)).toBe(original);
    expect(toApiError(new Error("boom"))).toMatchObject({ code: "UNEXPECTED", status: 0 });
    expect(isApiError(original)).toBe(true);
    expect(isApiError(new Error("boom"))).toBe(false);
  });
});
