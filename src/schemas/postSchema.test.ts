import { describe, expect, it } from "vitest";

import { issuesOf } from "../../test/zod";
import { postSchema } from "./postSchema";

describe("postSchema", () => {
  it("turns empty fields into nulls", () => {
    expect(postSchema.parse({ body: "  hello  ", code: "", codeLanguage: "" })).toEqual({
      body: "hello",
      code: null,
      codeLanguage: null,
    });
  });

  it("keeps leading indentation in code but drops trailing whitespace", () => {
    expect(postSchema.parse({ body: "", code: "  x = 1\n\n", codeLanguage: " Python " })).toEqual({
      body: null,
      code: "  x = 1",
      codeLanguage: "python",
    });
  });

  it("needs either a body or some code, reported on the body", () => {
    expect(issuesOf(postSchema, { body: "   ", code: "   ", codeLanguage: "" })).toEqual({
      body: "Write something or add some code",
    });
  });

  it("limits the body, the code and the language", () => {
    expect(issuesOf(postSchema, { body: "x".repeat(501), code: "", codeLanguage: "" })).toHaveProperty("body");
    expect(issuesOf(postSchema, { body: "", code: "x".repeat(4001), codeLanguage: "" })).toHaveProperty("code");
    expect(issuesOf(postSchema, { body: "hi", code: "", codeLanguage: "x".repeat(21) })).toHaveProperty(
      "codeLanguage",
    );
  });

  it("accepts language names like c++, c#, objective-c and .net", () => {
    for (const language of ["c++", "c#", "objective-c", ".net", "ts"]) {
      expect(postSchema.safeParse({ body: "hi", code: "", codeLanguage: language }).success).toBe(true);
    }
    expect(issuesOf(postSchema, { body: "hi", code: "", codeLanguage: "my lang" })).toEqual({
      codeLanguage: "Lowercase letters, digits and + # . - only",
    });
  });
});
