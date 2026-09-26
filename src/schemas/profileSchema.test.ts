import { describe, expect, it } from "vitest";

import { issuesOf } from "../../test/zod";
import { profileSchema } from "./profileSchema";

const valid = { displayName: "Ada", bio: "", githubUsername: "", websiteUrl: "" };

describe("profileSchema", () => {
  it("turns empty optional fields into nulls", () => {
    expect(profileSchema.parse(valid)).toEqual({ displayName: "Ada", bio: null, githubUsername: null, websiteUrl: null });
  });

  it("accepts GitHub usernames with single inner hyphens only", () => {
    expect(profileSchema.safeParse({ ...valid, githubUsername: "ada-lovelace" }).success).toBe(true);
    for (const bad of ["-ada", "ada-", "ada--l", "ada_l"]) {
      expect(issuesOf(profileSchema, { ...valid, githubUsername: bad })).toEqual({
        githubUsername: "Not a valid GitHub username",
      });
    }
  });

  it("only takes https links", () => {
    expect(profileSchema.safeParse({ ...valid, websiteUrl: "https://ada.dev" }).success).toBe(true);
    expect(issuesOf(profileSchema, { ...valid, websiteUrl: "http://ada.dev" })).toEqual({
      websiteUrl: "Use an https:// link",
    });
  });

  it("limits the bio to 160 characters", () => {
    expect(issuesOf(profileSchema, { ...valid, bio: "x".repeat(161) })).toEqual({
      bio: "Keep it under 160 characters",
    });
  });
});
