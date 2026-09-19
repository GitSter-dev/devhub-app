import { z } from "zod";

import { usernameField } from "./authFields";

export const usernameSchema = z.object({ username: usernameField });

export type UsernameInput = z.input<typeof usernameSchema>;
export type UsernameValues = z.output<typeof usernameSchema>;
