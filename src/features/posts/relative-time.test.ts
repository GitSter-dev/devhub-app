import { describe, expect, it } from "vitest";

import { relativeTime } from "./relative-time";

const NOW = Date.UTC(2026, 8, 26, 12, 0, 0);

describe("relativeTime", () => {
  it("counts up from now through minutes, hours and days", () => {
    expect(relativeTime(new Date(NOW - 30_000).toISOString(), NOW)).toBe("now");
    expect(relativeTime(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe("5m");
    expect(relativeTime(new Date(NOW - 3 * 3_600_000).toISOString(), NOW)).toBe("3h");
    expect(relativeTime(new Date(NOW - 6 * 86_400_000).toISOString(), NOW)).toBe("6d");
  });

  it("treats clock skew into the future as now", () => {
    expect(relativeTime(new Date(NOW + 60_000).toISOString(), NOW)).toBe("now");
  });

  it("switches to a date after a week, adding the year only when it differs", () => {
    const thisYear = relativeTime(new Date(Date.UTC(2026, 0, 15, 12)).toISOString(), NOW);
    const lastYear = relativeTime(new Date(Date.UTC(2025, 0, 15, 12)).toISOString(), NOW);

    expect(thisYear).not.toMatch(/2026/);
    expect(lastYear).toMatch(/2025/);
  });
});
