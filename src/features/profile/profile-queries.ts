import { useQuery } from "@tanstack/react-query";

import { fetchProfile } from "@/api/profiles-api";
import { sessionManager } from "@/session/session-manager";

export const profileKeys = {
  all: ["profile"] as const,
  profile: (username: string) => ["profile", username.toLowerCase()] as const,
  list: (username: string, list: string) => ["profile", username.toLowerCase(), list] as const,
};

export function useProfile(username: string) {
  return useQuery({
    queryKey: profileKeys.profile(username),
    queryFn: () => fetchProfile(sessionManager.client, username),
  });
}
