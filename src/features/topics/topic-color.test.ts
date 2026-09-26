import { describe, expect, it } from "vitest";

import { topicColor } from "./topic-color";

describe("topicColor", () => {
  it("uses the curated colour for known topics", () => {
    expect(topicColor("rust")).toBe("amber");
    expect(topicColor("typescript")).toBe("cyan");
  });

  it("gives unknown topics a stable colour from the palette", () => {
    const colour = topicColor("elixir");

    expect(["emerald", "cyan", "violet", "amber", "rose", "blue"]).toContain(colour);
    expect(topicColor("elixir")).toBe(colour);
  });
});
