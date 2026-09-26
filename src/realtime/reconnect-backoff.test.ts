import { describe, expect, it, vi } from "vitest";

import { reconnectDelay } from "./reconnect-backoff";
import { isChatEvent, realtimeEvents } from "./realtime-events";

describe("reconnectDelay", () => {
  it("draws a random delay under a ceiling that doubles from one second", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    expect(Math.round(reconnectDelay(1))).toBe(999);
    expect(Math.round(reconnectDelay(2))).toBe(1_998);
    expect(Math.round(reconnectDelay(4))).toBe(7_992);
  });

  it("never waits longer than thirty seconds", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);

    expect(reconnectDelay(20)).toBe(30_000);
  });
});

describe("realtime events", () => {
  it("fans events out to subscribers until they leave", () => {
    const listener = vi.fn();
    const leave = realtimeEvents.subscribe(listener);
    const event = { type: "NOTIFICATIONS_CHANGED", conversationId: null, data: {} } as const;

    realtimeEvents.emit(event);
    leave();
    realtimeEvents.emit(event);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("tells chat events apart from notification events", () => {
    expect(isChatEvent({ type: "NOTIFICATIONS_CHANGED", conversationId: null, data: {} })).toBe(false);
    expect(isChatEvent({ type: "TYPING", conversationId: "c1", data: { userId: "u", displayName: "U" } })).toBe(true);
  });
});
