import { describe, expect, it } from "vitest";

import { issuesOf } from "../../test/zod";
import { resetPasswordSchema } from "./resetPasswordSchema";

describe("resetPasswordSchema", () => {
  it("reports a mismatched confirmation on the confirmation field", () => {
    expect(
      issuesOf(resetPasswordSchema, {
        email: "ada@devhub.dev",
        code: "123456",
        newPassword: "supersecret1",
        confirmPassword: "supersecret2",
      }),
    ).toEqual({ confirmPassword: "Passwords don't match" });
  });

  it("accepts a matching new password", () => {
    expect(
      resetPasswordSchema.parse({
        email: "ADA@devhub.dev",
        code: "123456",
        newPassword: "supersecret1",
        confirmPassword: "supersecret1",
      }),
    ).toMatchObject({ email: "ada@devhub.dev" });
  });
});
