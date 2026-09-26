import { screen, waitFor } from "@testing-library/react";
import { Storage } from "expo-sqlite/kv-store";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import { followSync } from "@/features/follows/follow-sync";
import { currentUserQueryKey } from "@/session/use-session";
import PeopleScreen from "@/app/(setup)/people";

import { renderScreen } from "../render";
import { API, ok, server } from "../server";
import { signIn } from "../signed-in";

const suggestions = [
  { user: { id: "u1", username: "ada", displayName: "Ada" }, reason: { type: "SHARED_TOPICS", topics: ["rust", "go", "ai", "kotlin"] } },
  { user: { id: "u2", username: "ken", displayName: "Ken" }, reason: { type: "POPULAR", topics: [] } },
];

describe("People to follow", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
  });

  afterEach(() => {
    followSync.reset();
    queryClient.clear();
  });

  it("explains why each person is suggested", async () => {
    server.use(http.get(`${API}/users/me/suggestions`, () => ok(suggestions)));
    renderScreen(<PeopleScreen />);

    expect(await screen.findByText("Also into #rust, #go, #ai")).toBeTruthy();
    expect(screen.getByText("Suggested for you")).toBeTruthy();
  });

  it("follows someone after the tap settles and turns skip into continue", async () => {
    const follows: string[] = [];
    server.use(
      http.get(`${API}/users/me/suggestions`, () => ok(suggestions)),
      http.put(`${API}/users/me/following/:id`, ({ params }) => {
        follows.push(String(params.id));
        return ok(null);
      }),
    );
    const { user, container } = renderScreen(<PeopleScreen />);
    await screen.findByText("Also into #rust, #go, #ai");
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeTruthy();
    const followButton = (label: string) => container.querySelector(`[aria-label="${label}"]`);

    await user.click(followButton("Follow Ada")!);

    expect(followButton("Unfollow Ada")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    await waitFor(() => expect(follows).toEqual(["u1"]), { timeout: 2_000 });
  });

  it("finishes setup and remembers it on the device", async () => {
    const completed = { id: "me", username: "me", displayName: "Me", setupCompleted: true };
    server.use(
      http.get(`${API}/users/me/suggestions`, () => ok([])),
      http.put(`${API}/users/me/setup-completion`, () => ok(completed)),
    );
    const { user } = renderScreen(<PeopleScreen />);

    expect(await screen.findByText(/one of the first builders here/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    await waitFor(() => expect(queryClient.getQueryData(currentUserQueryKey)).toEqual(completed));
    expect(Storage.getItemSync("devhub.setup.completed")).toBe("true");
  });
});
