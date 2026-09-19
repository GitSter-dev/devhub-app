import { z } from "zod";

import { codeField, emailField } from "./authFields";

export const verifyEmailSchema = z.object({ email: emailField, code: codeField });

export type VerifyEmailInput = z.input<typeof verifyEmailSchema>;
export type VerifyEmailValues = z.output<typeof verifyEmailSchema>;
