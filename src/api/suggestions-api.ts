import type { KyInstance } from "ky";

import { unwrap } from "./http-client";

export type Suggestion = {
  user: { id: string; username: string; displayName: string };
  reason: { type: "SHARED_TOPICS" | "POPULAR"; topics: string[] };
};

export function fetchSuggestions(client: KyInstance, limit: number): Promise<Suggestion[]> {
  return unwrap<Suggestion[]>(client.get("users/me/suggestions", { searchParams: { limit } }));
}
