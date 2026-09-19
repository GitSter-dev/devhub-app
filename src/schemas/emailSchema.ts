import { z } from "zod";

import { emailField } from "./authFields";

export const emailSchema = z.object({ email: emailField });

export type EmailInput = z.input<typeof emailSchema>;
export type EmailValues = z.output<typeof emailSchema>;
