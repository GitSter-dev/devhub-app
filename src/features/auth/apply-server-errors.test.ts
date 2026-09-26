import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/api-error";

import { applyServerFieldErrors } from "./apply-server-errors";

type Form = { email: string; username: string; password: string };

describe("applyServerFieldErrors", () => {
  it("puts server field errors on the matching fields and focuses only the first", () => {
    const setError = vi.fn();
    const error = new ApiError(400, "VALIDATION_FAILED", "bad", { email: "taken", username: "too short", unknown: "x" });

    const applied = applyServerFieldErrors<Form>(error, setError, ["email", "username", "password"]);

    expect(applied).toBe(true);
    expect(setError.mock.calls).toEqual([
      ["email", { type: "server", message: "taken" }, { shouldFocus: true }],
      ["username", { type: "server", message: "too short" }, { shouldFocus: false }],
    ]);
  });

  it("maps an error code to a field", () => {
    const setError = vi.fn();

    const applied = applyServerFieldErrors<Form>(new ApiError(409, "EMAIL_TAKEN", "Email in use"), setError, ["email"], {
      EMAIL_TAKEN: "email",
    });

    expect(applied).toBe(true);
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Email in use" }, { shouldFocus: true });
  });

  it("reports when nothing could be placed on a field", () => {
    const setError = vi.fn();

    expect(applyServerFieldErrors<Form>(new ApiError(500, "INTERNAL_ERROR", "oops"), setError, ["email"])).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
