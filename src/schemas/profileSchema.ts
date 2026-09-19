import { z } from "zod";

import { displayNameField } from "./authFields";

const GITHUB_USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9]))*$/;
const HTTPS_URL = /^https:\/\/[^\s/$.?#][^\s]*$/i;

const optional = (value: string) => (value === "" ? null : value);

export const profileSchema = z.object({
  displayName: displayNameField,
  bio: z.string().trim().max(160, "Keep it under 160 characters").transform(optional),
  githubUsername: z
    .string()
    .trim()
    .max(39, "GitHub usernames are at most 39 characters")
    .refine((value) => value === "" || GITHUB_USERNAME.test(value), "Not a valid GitHub username")
    .transform(optional),
  websiteUrl: z
    .string()
    .trim()
    .max(200, "Use a shorter link")
    .refine((value) => value === "" || HTTPS_URL.test(value), "Use an https:// link")
    .transform(optional),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;
