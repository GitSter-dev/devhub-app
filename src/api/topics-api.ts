import type { KyInstance } from "ky";

import { unwrap } from "./http-client";

export type Topic = {
  slug: string;
  name: string;
};

type MyTopics = { slugs: string[] };

export function fetchTopics(client: KyInstance): Promise<Topic[]> {
  return unwrap<Topic[]>(client.get("topics"));
}

export async function fetchMyTopics(client: KyInstance): Promise<string[]> {
  return (await unwrap<MyTopics>(client.get("users/me/topics"))).slugs;
}

export async function saveMyTopics(client: KyInstance, slugs: readonly string[]): Promise<string[]> {
  return (await unwrap<MyTopics>(client.put("users/me/topics", { json: { slugs } }))).slugs;
}
