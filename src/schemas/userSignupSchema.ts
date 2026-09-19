import { z } from "zod";

import { displayNameField, emailField, passwordField, usernameField } from "./authFields";

export const userSignupSchema = z.object({
  username: usernameField,
  displayName: displayNameField,
  email: emailField,
  password: passwordField,
});

export type UserSignupInput = z.input<typeof userSignupSchema>;
export type UserSignupValues = z.output<typeof userSignupSchema>;
