import { z } from "zod";

import { codeField, emailField, passwordField } from "./authFields";

export const resetPasswordSchema = z
  .object({
    email: emailField,
    code: codeField,
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ResetPasswordValues = z.output<typeof resetPasswordSchema>;
