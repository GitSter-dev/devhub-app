import { act, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Post } from "@/api/posts-api";
import { likeSync } from "@/features/posts/like-sync";
import { sessionManager } from "@/session/session-manager";
import HomeScreen from "@/app/(app)/(tabs)/index";

import { renderScreen } from "../render";
import { API, ok, server } from "../server";
import { signIn } from "../signed-in";
import { tokenPair } from "../tokens";

function post(id: string, overrides: Partial<Post> = {}): Post {
  return {
    id,
    author: { id: "ada", username: "ada", displayName: "Ada" },
    body: `Post ${id}`,
    code: null,
    codeLanguage: null,
    createdAt: new Date().toISOString(),
    replyToId: null,
    replyToUsername: null,
    replyToDeleted: false,
    rootId: null,
    replyCount: 0,
    likeCount: 3,
    liked: false,
    mine: false,
    deleted: false,
    removed: false,
    underReview: false,
    ...overrides,
  };
}

function likeRequests(): string[] {
  const requests: string[] = [];
  server.use(
    http.put(`${API}/posts/:id/like`, ({ params }) => {
      requests.push(`like ${String(params.id)}`);
      return ok(null);
    }),
    http.delete(`${API}/posts/:id/like`, ({ params }) => {
      requests.push(`unlike ${String(params.id)}`);
      return ok(null);
    }),
  );
  return requests;
}

function likeButton(container: HTMLElement, postIndex = 0): HTMLElement {
  return container.querySelectorAll<HTMLElement>('[aria-label^="Like, "], [aria-label^="Unlike, "]')[postIndex];
}

describe("Home feed", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
  });

  afterEach(() => likeSync.reset());

  it("shows the posts in the feed", async () => {
    server.use(http.get(`${API}/feed`, () => ok({ items: [post("p1"), post("p2")], nextCursor: null })));
    renderScreen(<HomeScreen />);

    expect(await screen.findByText("Post p1")).toBeTruthy();
    expect(screen.getByText("Post p2")).toBeTruthy();
  });

  it("likes at once on screen and tells the server after the tap settles", async () => {
    server.use(http.get(`${API}/feed`, () => ok({ items: [post("p1")], nextCursor: null })));
    const requests = likeRequests();
    const { user, container } = renderScreen(<HomeScreen />);
    await screen.findByText("Post p1");

    await user.click(likeButton(container));

    expect(likeButton(container).getAttribute("aria-label")).toBe("Unlike, 4 likes");
    expect(requests).toEqual([]);
    await waitFor(() => expect(requests).toEqual(["like p1"]), { timeout: 2_000 });
  });

  it("sends nothing for a like and unlike in quick succession", async () => {
    server.use(http.get(`${API}/feed`, () => ok({ items: [post("p1", { liked: true, likeCount: 1 })], nextCursor: null })));
    const requests = likeRequests();
    const { user, container } = renderScreen(<HomeScreen />);
    await screen.findByText("Post p1");

    await user.click(likeButton(container));
    expect(likeButton(container).getAttribute("aria-label")).toBe("Like, 0 likes");
    await user.click(likeButton(container));

    expect(likeButton(container).getAttribute("aria-label")).toBe("Unlike, 1 like");
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(requests).toEqual([]);
  });

  it("points new users at people and topics when the feed is empty", async () => {
    server.use(http.get(`${API}/feed`, () => ok({ items: [], nextCursor: null })));
    renderScreen(<HomeScreen />);

    expect(await screen.findByText("Your feed is quiet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Find developers" })).toBeTruthy();
  });

  it("says when the app is offline and lets the user retry", async () => {
    server.use(
      http.get(`${API}/feed`, () => ok({ items: [post("p1")], nextCursor: null })),
      http.post(`${API}/auth/refresh`, () => ok(tokenPair("fresh"))),
    );
    const { user } = renderScreen(<HomeScreen />);
    await screen.findByText("Post p1");

    act(() => sessionManager.reportConnectivity(false));
    expect(await screen.findByText(/You're offline/)).toBeTruthy();
    await user.click(screen.getByRole("link", { name: "Try now" }));

    await waitFor(() => expect(screen.queryByText(/You're offline/)).toBeNull());
  });
});
