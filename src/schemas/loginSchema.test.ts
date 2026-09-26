import { describe, expect, it } from "vitest";

import { issuesOf } from "../../test/zod";
import { deleteAccountSchema } from "./deleteAccountSchema";
import { loginSchema } from "./loginSchema";
import { userSignupSchema } from "./userSignupSchema";
import { verifyEmailSchema } from "./verifyEmailSchema";

describe("form schemas", () => {
  it("trims the login identifier but never the password", () => {
    expect(loginSchema.parse({ identifier: "  ada ", password: " pw " })).toEqual({ identifier: "ada", password: " pw " });
    expect(issuesOf(loginSchema, { identifier: " ", password: "" })).toEqual({
      identifier: "Enter your email or username",
      password: "Enter your password",
    });
  });

  it("validates every signup field at once", () => {
    expect(issuesOf(userSignupSchema, { username: "a", displayName: "", email: "x", password: "short" })).toEqual({
      username: "Use at least 3 characters",
      displayName: "Tell people what to call you",
      email: "Enter a valid email address",
      password: "Use at least 8 characters",
    });
  });

  it("needs an email and a 6-digit code to verify", () => {
    expect(verifyEmailSchema.safeParse({ email: "ada@devhub.dev", code: "123456" }).success).toBe(true);
    expect(issuesOf(verifyEmailSchema, { email: "ada@devhub.dev", code: "12" })).toHaveProperty("code");
  });

  it("needs the password to delete an account", () => {
    expect(issuesOf(deleteAccountSchema, { password: "" })).toEqual({ password: "Enter your password" });
  });
});
