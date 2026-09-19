import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .max(254, "That email address is too long")
  .pipe(z.email("Enter a valid email address"))
  .transform((email) => email.toLowerCase());

export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters");

export const codeField = z
  .string()
  .regex(/^\d{6}$/, "Enter the 6-digit code from the email");

export const usernameField = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters")
  .max(30, "Use at most 30 characters")
  .regex(/^[A-Za-z0-9_]+$/, "Letters, digits and underscores only");

export const displayNameField = z.string().trim().min(1, "Tell people what to call you").max(50, "Use at most 50 characters");
