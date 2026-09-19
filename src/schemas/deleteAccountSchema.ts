import { z } from "zod";

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password"),
});

export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;
export type DeleteAccountValues = z.output<typeof deleteAccountSchema>;
