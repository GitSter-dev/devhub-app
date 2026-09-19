import { z } from "zod";

const LANGUAGE = /^[a-z0-9+#.-]+$/;

const optional = (value: string) => (value === "" ? null : value);

export const postSchema = z
  .object({
    body: z.string().trim().max(500, "Keep it under 500 characters").transform(optional),
    code: z
      .string()
      .max(4000, "Keep the code under 4000 characters")
      .transform((value) => optional(value.trimEnd())),
    codeLanguage: z
      .string()
      .trim()
      .toLowerCase()
      .max(20, "Use a shorter language name")
      .refine((value) => value === "" || LANGUAGE.test(value), "Lowercase letters, digits and + # . - only")
      .transform(optional),
  })
  .refine((post) => post.body !== null || post.code !== null, {
    message: "Write something or add some code",
    path: ["body"],
  });

export type PostInput = z.input<typeof postSchema>;
export type PostValues = z.output<typeof postSchema>;
