import { describe, expect, it } from "vitest";

import type { ActivityNotification } from "@/api/notifications-api";

import { notificationAction, notificationPreview, notificationWho } from "./notification-text";

function activity(overrides: Partial<ActivityNotification> = {}): ActivityNotification {
  return {
    id: "n1",
    type: "POST_LIKED",
    actors: [
      { id: "1", username: "ada", displayName: "Ada" },
      { id: "2", username: "ken", displayName: "Ken" },
    ],
    actorCount: 2,
    subjectId: "p1",
    targetId: null,
    preview: null,
    previewHasCode: false,
    updatedAt: "2026-09-01T12:00:00.000Z",
    seen: false,
    ...overrides,
  };
}

describe("notification text", () => {
  it("names one, two, or two and the rest", () => {
    expect(notificationWho(activity({ actorCount: 1, actors: [{ id: "1", username: "ada", displayName: "Ada" }] }))).toBe("Ada");
    expect(notificationWho(activity())).toBe("Ada and Ken");
    expect(notificationWho(activity({ actorCount: 3 }))).toBe("Ada, Ken and 1 other");
    expect(notificationWho(activity({ actorCount: 7 }))).toBe("Ada, Ken and 5 others");
    expect(notificationWho(activity({ actors: [], actorCount: 1 }))).toBe("Someone");
  });

  it("describes each kind of activity", () => {
    expect(notificationAction(activity({ type: "POST_REPLIED" }))).toBe("replied to your post");
    expect(notificationAction(activity({ type: "MESSAGE_REQUEST" }))).toBe("wants to message you");
  });

  it("previews text, or says it was code", () => {
    expect(notificationPreview(activity({ preview: "nice post" }))).toBe("nice post");
    expect(notificationPreview(activity({ previewHasCode: true }))).toBe("Code snippet");
    expect(notificationPreview(activity())).toBeNull();
  });
});
