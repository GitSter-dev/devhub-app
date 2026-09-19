import { toApiError, type ApiError } from "@/api/api-error";
import { followUser, unfollowUser } from "@/api/follows-api";
import { sessionManager } from "@/session/session-manager";
import { createStore, useStore } from "@/state/create-store";

const SETTLE_MS = 600;
const RETRY_BASE_MS = 2_000;
const RETRY_MAX_MS = 60_000;
const MAX_RETRIES = 5;

type Entry = {
  confirmed: boolean;
  desired: boolean;
  retries: number;
  timer: ReturnType<typeof setTimeout> | null;
  inFlight: boolean;
};

function isWorthRetrying(error: ApiError): boolean {
  return error.status === 429 || error.status >= 500 || error.isConnectivity;
}

function retryDelay(error: ApiError, retries: number): number {
  if (error.retryAfterSeconds != null) return error.retryAfterSeconds * 1000;
  return Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (retries - 1));
}

class FollowSync {
  readonly store = createStore<ReadonlyMap<string, boolean>>(new Map());

  private entries = new Map<string, Entry>();

  toggle(userId: string): void {
    const entry = this.entryFor(userId);
    entry.desired = !entry.desired;
    entry.retries = 0;
    this.publish();
    this.schedule(userId, entry, SETTLE_MS);
  }

  seed(userId: string, following: boolean): void {
    const entry = this.entryFor(userId);
    if (entry.timer || entry.inFlight || entry.desired !== entry.confirmed) return;
    if (entry.confirmed === following) return;
    entry.confirmed = following;
    entry.desired = following;
    this.publish();
  }

  reset(): void {
    this.entries.forEach((entry) => {
      if (entry.timer) clearTimeout(entry.timer);
    });
    this.entries = new Map();
    this.publish();
  }

  private entryFor(userId: string): Entry {
    let entry = this.entries.get(userId);
    if (!entry) {
      entry = { confirmed: false, desired: false, retries: 0, timer: null, inFlight: false };
      this.entries.set(userId, entry);
    }
    return entry;
  }

  private schedule(userId: string, entry: Entry, delay: number): void {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      entry.timer = null;
      void this.flush(userId, entry);
    }, delay);
  }

  private async flush(userId: string, entry: Entry): Promise<void> {
    if (entry.inFlight || entry.desired === entry.confirmed) return;
    const target = entry.desired;
    entry.inFlight = true;
    try {
      await (target ? followUser : unfollowUser)(sessionManager.client, userId);
      entry.confirmed = target;
      entry.retries = 0;
    } catch (error) {
      const apiError = toApiError(error);
      if (this.entries.get(userId) === entry && isWorthRetrying(apiError) && entry.retries < MAX_RETRIES) {
        entry.retries += 1;
        entry.inFlight = false;
        this.schedule(userId, entry, retryDelay(apiError, entry.retries));
        return;
      }
      entry.desired = entry.confirmed;
      entry.retries = 0;
      this.publish();
    } finally {
      entry.inFlight = false;
    }
    if (this.entries.get(userId) === entry && entry.desired !== entry.confirmed && !entry.timer) {
      this.schedule(userId, entry, 0);
    }
  }

  private publish(): void {
    this.store.set(new Map([...this.entries].map(([userId, entry]) => [userId, entry.desired])));
  }
}

export const followSync = new FollowSync();

export function useFollowing(): ReadonlyMap<string, boolean> {
  return useStore(followSync.store);
}
