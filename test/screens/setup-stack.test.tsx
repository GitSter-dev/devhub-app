import { screen, waitFor } from "@testing-library/react";
import { router } from "expo-router";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import StackScreen from "@/app/(setup)/stack";

import { renderScreen } from "../render";
import { API, fail, ok, server } from "../server";
import { signIn } from "../signed-in";

const TOPICS = ["rust", "go", "typescript", "kotlin", "ai", "design", "devops", "security", "databases", "game-dev", "open-source", "react-native"];

function topicEndpoints(mine: string[] = []): { saved: unknown[] } {
  const saved: unknown[] = [];
  server.use(
    http.get(`${API}/topics`, () => ok(TOPICS.map((slug) => ({ slug, name: slug })))),
    http.get(`${API}/users/me/topics`, () => ok({ slugs: mine })),
    http.put(`${API}/users/me/topics`, async ({ request }) => {
      const body = (await request.json()) as { slugs: string[] };
      saved.push(body);
      return ok(body);
    }),
  );
  return { saved };
}

describe("Pick your stack", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
  });

  afterEach(() => queryClient.clear());

  it("starts from the topics the user already picked", async () => {
    const { saved } = topicEndpoints(["rust", "go"]);
    const { user } = renderScreen(<StackScreen />);

    await screen.findByRole("checkbox", { name: "rust" });
    expect(screen.getByText("2 of 10 selected")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(saved).toEqual([{ slugs: ["rust", "go"] }]));
  });

  it("cannot continue with nothing picked", async () => {
    topicEndpoints();
    renderScreen(<StackScreen />);
    await screen.findByRole("checkbox", { name: "rust" });

    expect(screen.getByRole("button", { name: "Continue" })).toHaveProperty("ariaDisabled", "true");
  });

  it("stops at ten topics", async () => {
    topicEndpoints();
    const { user } = renderScreen(<StackScreen />);
    await screen.findByRole("checkbox", { name: "rust" });

    for (const slug of TOPICS.slice(0, 10)) await user.click(screen.getByRole("checkbox", { name: slug }));

    expect(screen.getByText("10 of 10 selected")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "open-source" })).toHaveProperty("ariaDisabled", "true");
    expect(screen.getByRole("checkbox", { name: "rust" })).not.toHaveProperty("ariaDisabled", "true");
  });

  it("saves the picks and moves on to people", async () => {
    const { saved } = topicEndpoints(["rust"]);
    const { user } = renderScreen(<StackScreen />);
    await user.click(await screen.findByRole("checkbox", { name: "go" }));
    await user.click(screen.getByRole("checkbox", { name: "rust" }));

    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/people"));
    expect(saved).toEqual([{ slugs: ["go"] }]);
  });

  it("offers a retry when topics fail to load", async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/topics`, () => (++calls === 1 ? fail(404, "NOT_FOUND", "Topics are unavailable") : ok([{ slug: "rust", name: "Rust" }]))),
      http.get(`${API}/users/me/topics`, () => ok({ slugs: [] })),
    );
    const { user } = renderScreen(<StackScreen />);

    expect(await screen.findByText("Topics are unavailable")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("checkbox", { name: "rust" })).toBeTruthy();
  });
});
