import { Client } from "@stomp/stompjs";

import { env } from "@/config/env";
import { sessionManager } from "@/session/session-manager";
import { createStore } from "@/state/create-store";

import { reconnectDelay } from "./reconnect-backoff";
import { realtimeEvents, type RealtimeEvent } from "./realtime-events";

export type RealtimeState =
  | { status: "idle" }
  | { status: "connecting"; attempt: number }
  | { status: "connected" }
  | { status: "reconnecting"; attempt: number; retryAt: number }
  | { status: "suspended" }
  | { status: "closed"; reason: "replaced" | "expired" };

const HEARTBEAT_MS = 10_000;
const CONNECTION_TIMEOUT_MS = 10_000;
const CLOSE_SESSION_REPLACED = 4001;
const CLOSE_SESSION_ENDED = 4002;
const EVENTS_DESTINATION = "/user/queue/events";

class RealtimeConnection {
  readonly store = createStore<RealtimeState>({ status: "idle" });

  private client: Client | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private attempt = 0;

  start(): void {
    if (this.store.get().status !== "idle") return;
    this.connectFresh();
  }

  stop(): void {
    this.teardown();
    this.store.set({ status: "idle" });
  }

  suspend(): void {
    const { status } = this.store.get();
    if (status === "idle" || status === "suspended" || status === "closed") return;
    this.teardown();
    this.store.set({ status: "suspended" });
  }

  resume(): void {
    const { status } = this.store.get();
    if (status === "suspended" || status === "reconnecting") this.connectFresh();
  }

  retryNow(): void {
    if (this.store.get().status === "reconnecting") this.connectFresh();
  }

  private connectFresh(): void {
    this.teardown();
    this.attempt = 0;
    void this.connect(this.generation);
  }

  publish(destination: string): void {
    if (this.client?.connected) this.client.publish({ destination, body: "" });
  }

  private async connect(generation: number): Promise<void> {
    this.store.set({ status: "connecting", attempt: this.attempt });
    const token = await sessionManager.currentAccessToken();
    if (generation !== this.generation) return;
    if (!token) {
      this.scheduleReconnect();
      return;
    }

    let rejection: string | undefined;
    const client = new Client({
      brokerURL: env.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,
      heartbeatIncoming: HEARTBEAT_MS,
      heartbeatOutgoing: HEARTBEAT_MS,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      discardWebsocketOnCommFailure: true,
    });
    client.onConnect = () => {
      if (generation !== this.generation) return;
      this.attempt = 0;
      client.subscribe(EVENTS_DESTINATION, (frame) => {
        try {
          realtimeEvents.emit(JSON.parse(frame.body) as RealtimeEvent);
        } catch {
          return;
        }
      });
      this.store.set({ status: "connected" });
      realtimeEvents.emitResync();
    };
    client.onStompError = (frame) => {
      rejection = frame.headers.message;
    };
    client.onWebSocketClose = (event) => {
      if (generation !== this.generation) return;
      void this.handleClose(event.code, rejection);
    };
    this.client = client;
    client.activate();
  }

  private async handleClose(code: number, rejection: string | undefined): Promise<void> {
    this.disposeClient();
    if (code === CLOSE_SESSION_REPLACED) {
      await this.endSession("replaced");
    } else if (code === CLOSE_SESSION_ENDED || rejection === "SESSION_ENDED") {
      await this.endSession("expired");
    } else {
      const generation = this.generation;
      if (rejection === "UNAUTHORIZED") await sessionManager.refreshedAccessToken();
      if (generation === this.generation) this.scheduleReconnect();
    }
  }

  private async endSession(reason: "replaced" | "expired"): Promise<void> {
    this.teardown();
    this.store.set({ status: "closed", reason });
    await sessionManager.endSessionFromServer(reason);
  }

  private scheduleReconnect(): void {
    this.attempt += 1;
    const delay = reconnectDelay(this.attempt);
    const generation = this.generation;
    this.store.set({ status: "reconnecting", attempt: this.attempt, retryAt: Date.now() + delay });
    this.retryTimer = setTimeout(() => {
      if (generation === this.generation) void this.connect(generation);
    }, delay);
  }

  private teardown(): void {
    this.generation += 1;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.disposeClient();
  }

  private disposeClient(): void {
    const client = this.client;
    this.client = null;
    if (client) void client.deactivate();
  }
}

export const realtimeConnection = new RealtimeConnection();
