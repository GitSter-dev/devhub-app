import type { KyInstance } from "ky";

import { unwrap } from "./http-client";
import type { PersonSummary } from "./profiles-api";

export const SEARCH_LIMIT = 20;

export function searchPeople(client: KyInstance, query: string, signal?: AbortSignal): Promise<PersonSummary[]> {
  return unwrap<PersonSummary[]>(client.get("users/search", { searchParams: { q: query, limit: SEARCH_LIMIT }, signal }));
}
