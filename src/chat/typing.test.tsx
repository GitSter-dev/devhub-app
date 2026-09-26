import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { realtimeConnection } from "@/realtime/realtime-connection";

import { ADA, KEN } from "../../test/chat-fixtures";
import { typing, useTypists } from "./typing";

describe("typing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    act(() => typing.reset());
    vi.useRealTimers();
  });

  it("shows who is typing in a conversation", () => {
    const { result } = renderHook(() => useTypists("c1"));

    act(() => {
      typing.received("c1", ADA.id, ADA.displayName);
      typing.received("c1", KEN.id, KEN.displayName);
      typing.received("c2", "someone", "Elsewhere");
    });

    expect(result.current).toEqual(["Ada", "Ken"]);
  });

  it("hides a typist five seconds after the last signal", () => {
    const { result } = renderHook(() => useTypists("c1"));
    act(() => typing.received("c1", ADA.id, ADA.displayName));

    act(() => vi.advanceTimersByTime(4_000));
    act(() => typing.received("c1", ADA.id, ADA.displayName));
    act(() => vi.advanceTimersByTime(4_999));
    expect(result.current).toEqual(["Ada"]);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toEqual([]);
  });

  it("hides a typist as soon as they stop", () => {
    const { result } = renderHook(() => useTypists("c1"));
    act(() => typing.received("c1", ADA.id, ADA.displayName));

    act(() => typing.stopped("c1", ADA.id));

    expect(result.current).toEqual([]);
  });

  it("announces my own typing at most once every three seconds", () => {
    const publish = vi.spyOn(realtimeConnection, "publish").mockImplementation(() => undefined);

    typing.announce("c1");
    typing.announce("c1");
    vi.advanceTimersByTime(2_999);
    typing.announce("c1");
    vi.advanceTimersByTime(1);
    typing.announce("c1");
    typing.announce("c2");

    expect(publish.mock.calls).toEqual([
      ["/app/conversations/c1/typing"],
      ["/app/conversations/c1/typing"],
      ["/app/conversations/c2/typing"],
    ]);
  });
});
