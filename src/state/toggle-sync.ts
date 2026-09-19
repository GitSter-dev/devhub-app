import { toApiError, type ApiError } from "@/api/api-error";
import { createStore } from "./create-store";

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

type ToggleActions = {
  turnOn: (id: string) => Promise<void>;
  turnOff: (id: string) => Promise<void>;
};

export class ToggleSync {
  readonly store = createStore<ReadonlyMap<string, boolean>>(new Map());

  private entries = new Map<string, Entry>();

  constructor(private readonly actions: ToggleActions) {}

  toggle(id: string): void {
    const entry = this.entryFor(id);
    entry.desired = !entry.desired;
    entry.retries = 0;
    this.publish();
    this.schedule(id, entry, SETTLE_MS);
  }

  seed(id: string, on: boolean): void {
    const entry = this.entryFor(id);
    if (entry.timer || entry.inFlight || entry.desired !== entry.confirmed) return;
    if (entry.confirmed === on) return;
    entry.confirmed = on;
    entry.desired = on;
    this.publish();
  }

  reset(): void {
    this.entries.forEach((entry) => {
      if (entry.timer) clearTimeout(entry.timer);
    });
    this.entries = new Map();
    this.publish();
  }

  private entryFor(id: string): Entry {
    let entry = this.entries.get(id);
    if (!entry) {
      entry = { confirmed: false, desired: false, retries: 0, timer: null, inFlight: false };
      this.entries.set(id, entry);
    }
    return entry;
  }

  private schedule(id: string, entry: Entry, delay: number): void {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      entry.timer = null;
      void this.flush(id, entry);
    }, delay);
  }

  private async flush(id: string, entry: Entry): Promise<void> {
    if (entry.inFlight || entry.desired === entry.confirmed) return;
    const target = entry.desired;
    entry.inFlight = true;
    try {
      await (target ? this.actions.turnOn : this.actions.turnOff)(id);
      entry.confirmed = target;
      entry.retries = 0;
    } catch (error) {
      const apiError = toApiError(error);
      if (this.entries.get(id) === entry && isWorthRetrying(apiError) && entry.retries < MAX_RETRIES) {
        entry.retries += 1;
        entry.inFlight = false;
        this.schedule(id, entry, retryDelay(apiError, entry.retries));
        return;
      }
      entry.desired = entry.confirmed;
      entry.retries = 0;
      this.publish();
    } finally {
      entry.inFlight = false;
    }
    if (this.entries.get(id) === entry && entry.desired !== entry.confirmed && !entry.timer) {
      this.schedule(id, entry, 0);
    }
  }

  private publish(): void {
    this.store.set(new Map([...this.entries].map(([id, entry]) => [id, entry.desired])));
  }
}
