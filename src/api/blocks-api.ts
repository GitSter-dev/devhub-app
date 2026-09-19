import type { KyInstance } from "ky";

import { unwrap } from "./http-client";
import type { PersonSummary } from "./profiles-api";

export type BlockedPage = { items: PersonSummary[]; nextCursor: string | null };

export const blocksApi = {
  block: (client: KyInstance, userId: string) => unwrap<void>(client.put(`users/me/blocks/${userId}`)),
  unblock: (client: KyInstance, userId: string) => unwrap<void>(client.delete(`users/me/blocks/${userId}`)),
  list: (client: KyInstance, cursor: string | null) =>
    unwrap<BlockedPage>(client.get("users/me/blocks", { searchParams: cursor ? { cursor } : {} })),
};
