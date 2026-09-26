import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "./use-countdown";
import { useDebouncedValue } from "./use-debounced-value";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down to zero one second at a time", () => {
    const { result } = renderHook(() => useCountdown(3));
    expect(result.current).toBe(3);

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(2);

    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current).toBe(0);
  });

  it("starts over when the restart key changes", () => {
    const { result, rerender } = renderHook(({ round }) => useCountdown(10, round), { initialProps: { round: 0 } });
    act(() => vi.advanceTimersByTime(8_000));
    expect(result.current).toBe(2);

    rerender({ round: 1 });

    expect(result.current).toBe(10);
  });

  it("shows nothing without a duration", () => {
    expect(renderHook(() => useCountdown(null)).result.current).toBe(0);
  });
});

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("settles on the last value once typing pauses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: "a" } });

    rerender({ value: "ad" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: "ada" });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("ada");
  });
});
