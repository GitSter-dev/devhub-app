import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { reportFlow, useReportTarget } from "./report-store";

describe("report flow", () => {
  it("opens and closes the report sheet for a target", () => {
    const { result } = renderHook(() => useReportTarget());

    act(() => reportFlow.open({ type: "POST", id: "p1", username: "ada", userId: "u1" }));
    expect(result.current).toEqual({ type: "POST", id: "p1", username: "ada", userId: "u1" });

    act(() => reportFlow.close());
    expect(result.current).toBeNull();
  });
});
