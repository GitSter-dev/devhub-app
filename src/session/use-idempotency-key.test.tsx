import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useIdempotencyKey } from "./use-idempotency-key";

describe("useIdempotencyKey", () => {
  it("reuses the key while the same payload is retried", () => {
    const { result } = renderHook(() => useIdempotencyKey());

    const first = result.current.keyFor({ identifier: "ada", password: "pw" });

    expect(result.current.keyFor({ identifier: "ada", password: "pw" })).toBe(first);
  });

  it("issues a new key once the payload changes", () => {
    const { result } = renderHook(() => useIdempotencyKey());

    const first = result.current.keyFor({ identifier: "ada" });

    expect(result.current.keyFor({ identifier: "ken" })).not.toBe(first);
  });

  it("issues a new key for the same payload after a rotation", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const first = result.current.keyFor({ identifier: "ada" });

    result.current.rotate();

    expect(result.current.keyFor({ identifier: "ada" })).not.toBe(first);
  });

  it("keeps its memory across re-renders", () => {
    const { result, rerender } = renderHook(() => useIdempotencyKey());
    const first = result.current.keyFor({ identifier: "ada" });

    rerender();

    expect(result.current.keyFor({ identifier: "ada" })).toBe(first);
  });
});
