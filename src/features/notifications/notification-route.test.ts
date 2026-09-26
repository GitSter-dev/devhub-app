import { router } from "expo-router";
import { describe, expect, it } from "vitest";

import { lastUserStore } from "@/session/last-user-store";

import { openNotification, targetFromPush, type NotificationTarget } from "./notification-route";

function target(overrides: Partial<NotificationTarget>): NotificationTarget {
  return { type: "POST_LIKED", subjectId: "post-1", targetId: "reply-1", actorCount: 1, actorUsername: "ada", ...overrides };
}

describe("opening a notification", () => {
  it("opens the liked post", () => {
    openNotification(target({ type: "POST_LIKED" }));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/post/[id]", params: { id: "post-1" } });
  });

  it("opens the reply itself for one reply, and the post for several", () => {
    openNotification(target({ type: "POST_REPLIED" }));
    openNotification(target({ type: "POST_REPLIED", actorCount: 3 }));

    expect(router.push).toHaveBeenNthCalledWith(1, { pathname: "/post/[id]", params: { id: "reply-1" } });
    expect(router.push).toHaveBeenNthCalledWith(2, { pathname: "/post/[id]", params: { id: "post-1" } });
  });

  it("opens the new follower, or my followers list when there are several", () => {
    lastUserStore.write({ id: "me", username: "me", displayName: "Me" });

    openNotification(target({ type: "NEW_FOLLOWER" }));
    openNotification(target({ type: "NEW_FOLLOWER", actorCount: 4 }));

    expect(router.push).toHaveBeenNthCalledWith(1, { pathname: "/u/[username]", params: { username: "ada" } });
    expect(router.push).toHaveBeenNthCalledWith(2, { pathname: "/u/[username]/followers", params: { username: "me" } });
  });

  it("opens one new post directly and sends several to the feed", () => {
    openNotification(target({ type: "FOLLOWED_POSTED" }));
    openNotification(target({ type: "FOLLOWED_POSTED", actorCount: 2 }));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/post/[id]", params: { id: "reply-1" } });
    expect(router.navigate).toHaveBeenCalledWith("/");
  });

  it("opens message requests", () => {
    openNotification(target({ type: "MESSAGE_REQUEST" }));

    expect(router.push).toHaveBeenCalledWith({ pathname: "/messages", params: { tab: "requests" } });
  });

  it("does nothing for a post notification without a post", () => {
    openNotification(target({ type: "POST_LIKED", subjectId: null }));

    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("reading a push payload", () => {
  it("builds a target from the push data", () => {
    expect(targetFromPush({ type: "POST_REPLIED", subjectId: "p1", targetId: "r1", actorCount: "3", actorUsername: "ada" })).toEqual({
      type: "POST_REPLIED",
      subjectId: "p1",
      targetId: "r1",
      actorCount: 3,
      actorUsername: "ada",
    });
  });

  it("treats a missing or unreadable count as one person", () => {
    expect(targetFromPush({ type: "NEW_FOLLOWER" })).toMatchObject({ actorCount: 1, subjectId: null });
    expect(targetFromPush({ type: "NEW_FOLLOWER", actorCount: "lots" })).toMatchObject({ actorCount: 1 });
  });

  it("ignores payloads that are not activity", () => {
    expect(targetFromPush({ kind: "chat" })).toBeNull();
  });
});
