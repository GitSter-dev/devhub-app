import type { KyInstance } from "ky";

import { unwrap } from "./http-client";
import type { CurrentUser } from "./users-api";

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  githubUsername: string | null;
  websiteUrl: string | null;
  topics: string[];
  followerCount: number;
  followingCount: number;
  joinedAt: string;
  me: boolean;
  following: boolean;
  followsYou: boolean;
};

export type ProfileEdit = {
  displayName: string;
  bio: string | null;
  githubUsername: string | null;
  websiteUrl: string | null;
};

export type PersonSummary = {
  id: string;
  username: string;
  displayName: string;
  following: boolean;
};

export type PersonPage = {
  items: PersonSummary[];
  nextCursor: string | null;
};

export type FollowList = "followers" | "following";

export type UsernameAvailability = {
  available: boolean;
  reason: "TAKEN" | "INVALID" | null;
};

export function fetchProfile(client: KyInstance, username: string): Promise<Profile> {
  return unwrap<Profile>(client.get(`users/${encodeURIComponent(username)}/profile`));
}

export function updateMyProfile(client: KyInstance, edit: ProfileEdit): Promise<Profile> {
  return unwrap<Profile>(client.put("users/me/profile", { json: edit }));
}

export function fetchFollowList(
  client: KyInstance,
  username: string,
  list: FollowList,
  cursor: string | null,
): Promise<PersonPage> {
  return unwrap<PersonPage>(
    client.get(`users/${encodeURIComponent(username)}/${list}`, { searchParams: cursor ? { cursor } : {} }),
  );
}

export function changeUsername(client: KyInstance, username: string): Promise<CurrentUser> {
  return unwrap<CurrentUser>(client.put("users/me/username", { json: { username } }));
}

export function checkUsername(client: KyInstance, username: string): Promise<UsernameAvailability> {
  return unwrap<UsernameAvailability>(client.get("users/username-availability", { searchParams: { username } }));
}
