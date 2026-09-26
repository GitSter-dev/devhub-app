import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API, ok, server } from "../../test/server";
import { tokenPair } from "../../test/tokens";

type Frame = { body: string };
type Config = { brokerURL: string; connectHeaders: Record<string, string> };

class FakeClient {
  static instances: FakeClient[] = [];
  onConnect: () => void = () => undefined;
  onStompError: (frame: { headers: { message?: string } }) => void = () => undefined;
  onWebSocketClose: (event: { code: number }) => void = () => undefined;
  connected = false;
  activated = false;
  deactivated = false;
  subscriptions: { destination: string; callback: (frame: Frame) => void }[] = [];
  published: { destination: string; body: string }[] = [];

  constructor(readonly config: Config) {
    FakeClient.instances.push(this);
  }

  activate(): void {
    this.activated = true;
  }

  async deactivate(): Promise<void> {
    this.deactivated = true;
    this.connected = false;
  }

  subscribe(destination: string, callback: (frame: Frame) => void): void {
    this.subscriptions.push({ destination, callback });
  }

  publish(message: { destination: string; body: string }): void {
    this.published.push(message);
  }

  connect(): void {
    this.connected = true;
    this.onConnect();
  }

  reject(message: string, code = 1002): void {
    this.onStompError({ headers: { message } });
    this.onWebSocketClose({ code });
  }
}

vi.mock("@stomp/stompjs", () => ({ Client: FakeClient }));

async function load() {
  vi.resetModules();
  FakeClient.instances = [];
  const { sessionManager } = await import("@/session/session-manager");
  const { realtimeConnection } = await import("./realtime-connection");
  const { realtimeEvents } = await import("./realtime-events");
  await sessionManager.startSession(tokenPair("a"));
  return { sessionManager, realtimeConnection, realtimeEvents };
}

async function connecting(count = 1): Promise<FakeClient> {
  await vi.waitFor(() => expect(FakeClient.instances).toHaveLength(count));
  return FakeClient.instances[count - 1];
}

describe("realtime connection", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => vi.useRealTimers());

  it("connects to the socket with the access token", async () => {
    const { realtimeConnection } = await load();

    realtimeConnection.start();
    const client = await connecting();

    expect(client.config.brokerURL).toBe("ws://api.test/ws");
    expect(client.config.connectHeaders).toEqual({ Authorization: "Bearer a-access" });
    expect(client.activated).toBe(true);
    expect(realtimeConnection.store.get()).toEqual({ status: "connecting", attempt: 0 });
  });

  it("subscribes to my event queue and asks everyone to resync once connected", async () => {
    const { realtimeConnection, realtimeEvents } = await load();
    const resync = vi.fn();
    realtimeEvents.onResync(resync);

    realtimeConnection.start();
    (await connecting()).connect();

    expect(realtimeConnection.store.get()).toEqual({ status: "connected" });
    expect(FakeClient.instances[0].subscriptions.map((s) => s.destination)).toEqual(["/user/queue/events"]);
    expect(resync).toHaveBeenCalledTimes(1);
  });

  it("passes events through and ignores frames it cannot read", async () => {
    const { realtimeConnection, realtimeEvents } = await load();
    const events = vi.fn();
    realtimeEvents.subscribe(events);
    realtimeConnection.start();
    const client = await connecting();
    client.connect();
    const deliver = client.subscriptions[0].callback;

    deliver({ body: "not json" });
    deliver({ body: JSON.stringify({ type: "NOTIFICATIONS_CHANGED", conversationId: null, data: {} }) });

    expect(events).toHaveBeenCalledTimes(1);
    expect(events).toHaveBeenCalledWith({ type: "NOTIFICATIONS_CHANGED", conversationId: null, data: {} });
  });

  it("ends the session as replaced when the server closes with 4001", async () => {
    const { realtimeConnection, sessionManager } = await load();
    realtimeConnection.start();
    const client = await connecting();
    client.connect();

    client.onWebSocketClose({ code: 4001 });

    await vi.waitFor(() =>
      expect(sessionManager.store.get()).toMatchObject({ status: "reauthRequired", reason: "replaced" }),
    );
    expect(realtimeConnection.store.get()).toEqual({ status: "closed", reason: "replaced" });
  });

  it("ends the session as expired on 4002 or a SESSION_ENDED rejection", async () => {
    const first = await load();
    first.realtimeConnection.start();
    (await connecting()).onWebSocketClose({ code: 4002 });
    await vi.waitFor(() => expect(first.realtimeConnection.store.get()).toEqual({ status: "closed", reason: "expired" }));

    const second = await load();
    second.realtimeConnection.start();
    (await connecting()).reject("SESSION_ENDED");
    await vi.waitFor(() => expect(second.sessionManager.store.get()).toMatchObject({ reason: "expired" }));
  });

  it("refreshes the token after an UNAUTHORIZED rejection and reconnects with the new one", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const { realtimeConnection } = await load();
    server.use(http.post(`${API}/auth/refresh`, () => ok(tokenPair("b"))));
    realtimeConnection.start();

    (await connecting()).reject("UNAUTHORIZED");
    await vi.waitFor(() => expect(realtimeConnection.store.get()).toMatchObject({ status: "reconnecting", attempt: 1 }));
    await vi.advanceTimersByTimeAsync(500);

    const retry = await connecting(2);
    expect(retry.config.connectHeaders).toEqual({ Authorization: "Bearer b-access" });
  });

  it("backs off with growing delays while the network keeps failing", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const { realtimeConnection } = await load();
    realtimeConnection.start();
    await vi.advanceTimersByTimeAsync(0);

    FakeClient.instances[0].onWebSocketClose({ code: 1006 });
    await vi.advanceTimersByTimeAsync(0);
    expect(realtimeConnection.store.get()).toMatchObject({ status: "reconnecting", attempt: 1, retryAt: Date.now() + 500 });
    await vi.advanceTimersByTimeAsync(499);
    expect(FakeClient.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeClient.instances).toHaveLength(2);

    FakeClient.instances[1].onWebSocketClose({ code: 1006 });
    await vi.advanceTimersByTimeAsync(0);
    expect(realtimeConnection.store.get()).toMatchObject({ status: "reconnecting", attempt: 2, retryAt: Date.now() + 1_000 });
    await vi.advanceTimersByTimeAsync(999);
    expect(FakeClient.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeClient.instances).toHaveLength(3);
  });

  it("lets the user skip the wait and reconnect now", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const { realtimeConnection } = await load();
    realtimeConnection.start();
    (await connecting()).onWebSocketClose({ code: 1006 });
    await vi.waitFor(() => expect(realtimeConnection.store.get()).toMatchObject({ status: "reconnecting" }));

    realtimeConnection.retryNow();

    await connecting(2);
    expect(realtimeConnection.store.get()).toEqual({ status: "connecting", attempt: 0 });
  });

  it("ignores a late close from a connection it already replaced", async () => {
    const { realtimeConnection } = await load();
    realtimeConnection.start();
    const stale = await connecting();

    realtimeConnection.suspend();
    stale.onWebSocketClose({ code: 4001 });

    expect(stale.deactivated).toBe(true);
    expect(realtimeConnection.store.get()).toEqual({ status: "suspended" });
  });

  it("reconnects from scratch when resumed", async () => {
    const { realtimeConnection } = await load();
    realtimeConnection.start();
    await connecting();
    realtimeConnection.suspend();

    realtimeConnection.resume();

    await connecting(2);
    expect(realtimeConnection.store.get()).toEqual({ status: "connecting", attempt: 0 });
  });

  it("does not start twice or suspend when idle", async () => {
    const { realtimeConnection } = await load();

    realtimeConnection.suspend();
    expect(realtimeConnection.store.get()).toEqual({ status: "idle" });

    realtimeConnection.start();
    realtimeConnection.start();
    await connecting();
    expect(FakeClient.instances).toHaveLength(1);
  });

  it("publishes only while connected", async () => {
    const { realtimeConnection } = await load();
    realtimeConnection.start();
    const client = await connecting();

    realtimeConnection.publish("/app/conversations/c1/typing");
    client.connect();
    realtimeConnection.publish("/app/conversations/c1/typing");

    expect(client.published).toEqual([{ destination: "/app/conversations/c1/typing", body: "" }]);
  });

  it("waits and retries when there is no token to connect with", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const { realtimeConnection, sessionManager } = await load();
    await sessionManager.signOut();

    realtimeConnection.start();

    await vi.waitFor(() => expect(realtimeConnection.store.get()).toMatchObject({ status: "reconnecting", attempt: 1 }));
    expect(FakeClient.instances).toHaveLength(0);
  });

  it("drops the connection when stopped", async () => {
    const { realtimeConnection } = await load();
    realtimeConnection.start();
    const client = await connecting();

    realtimeConnection.stop();

    expect(client.deactivated).toBe(true);
    expect(realtimeConnection.store.get()).toEqual({ status: "idle" });
  });
});
