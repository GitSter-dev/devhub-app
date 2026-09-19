import { z } from "zod";

import { emailField, passwordField } from "./authFields";

export const userSignupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters")
    .max(30, "Use at most 30 characters")
    .regex(/^[A-Za-z0-9_]+$/, "Letters, digits and underscores only"),
  displayName: z.string().trim().min(1, "Tell people what to call you").max(50, "Use at most 50 characters"),
  email: emailField,
  password: passwordField,
});

export type UserSignupInput = z.input<typeof userSignupSchema>;
export type UserSignupValues = z.output<typeof userSignupSchema>;
