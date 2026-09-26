import { describe, expect, it } from "vitest";

import { codeField, displayNameField, emailField, passwordField, usernameField } from "./authFields";

describe("auth fields", () => {
  it("trims and lowercases an email", () => {
    expect(emailField.parse("  Ada@DevHub.dev ")).toBe("ada@devhub.dev");
  });

  it("rejects an empty, malformed or overlong email with a readable message", () => {
    expect(emailField.safeParse("   ").error?.issues[0].message).toBe("Enter your email address");
    expect(emailField.safeParse("ada@").error?.issues[0].message).toBe("Enter a valid email address");
    expect(emailField.safeParse(`${"a".repeat(250)}@x.io`).error?.issues[0].message).toBe(
      "That email address is too long",
    );
  });

  it("accepts passwords of 8 to 72 characters, the backend's bcrypt limit", () => {
    expect(passwordField.safeParse("1234567").success).toBe(false);
    expect(passwordField.safeParse("12345678").success).toBe(true);
    expect(passwordField.safeParse("x".repeat(72)).success).toBe(true);
    expect(passwordField.safeParse("x".repeat(73)).success).toBe(false);
  });

  it("accepts only a 6-digit code", () => {
    expect(codeField.safeParse("123456").success).toBe(true);
    expect(codeField.safeParse("12345").success).toBe(false);
    expect(codeField.safeParse("12345a").success).toBe(false);
    expect(codeField.safeParse(" 123456").success).toBe(false);
  });

  it("allows usernames of letters, digits and underscores between 3 and 30 characters", () => {
    expect(usernameField.parse("  ada_99 ")).toBe("ada_99");
    expect(usernameField.safeParse("ad").success).toBe(false);
    expect(usernameField.safeParse("a".repeat(31)).success).toBe(false);
    expect(usernameField.safeParse("ada-lovelace").error?.issues[0].message).toBe(
      "Letters, digits and underscores only",
    );
  });

  it("requires a display name of at most 50 characters", () => {
    expect(displayNameField.safeParse("  ").success).toBe(false);
    expect(displayNameField.parse(" Ada ")).toBe("Ada");
    expect(displayNameField.safeParse("x".repeat(51)).success).toBe(false);
  });
});
