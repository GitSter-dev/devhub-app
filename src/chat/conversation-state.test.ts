import { describe, expect, it } from "vitest";

import { ADA, KEN, ME, conversation, member, message } from "../../test/chat-fixtures";
import { withNewMessage, withoutMessageContent, withWatermarks } from "./conversation-state";

describe("withWatermarks", () => {
  it("takes the slowest other active member as the delivered and read marks", () => {
    const group = conversation("c1", {
      members: [
        member(ME, { deliveredSeq: 9, readSeq: 9 }),
        member(ADA, { deliveredSeq: 7, readSeq: 5 }),
        member(KEN, { deliveredSeq: 4, readSeq: 2 }),
      ],
    });

    expect(withWatermarks(group, "me")).toMatchObject({ othersDeliveredSeq: 4, othersReadSeq: 2 });
  });

  it("counts members who are not active as having seen nothing", () => {
    const group = conversation("c1", {
      members: [member(ME), member(ADA, { deliveredSeq: 7, readSeq: 7 }), member(KEN, { status: "REQUEST", deliveredSeq: 7, readSeq: 7 })],
    });

    expect(withWatermarks(group, "me")).toMatchObject({ othersDeliveredSeq: 0, othersReadSeq: 0 });
  });

  it("reports zero when nobody else is in the conversation", () => {
    expect(withWatermarks(conversation("c1", { members: [member(ME)] }), "me")).toMatchObject({
      othersDeliveredSeq: 0,
      othersReadSeq: 0,
    });
  });
});

describe("withNewMessage", () => {
  it("makes the newest message the preview and bumps activity", () => {
    const next = withNewMessage(conversation("c1", { lastSeq: 1, lastMessage: message(1) }), message(2), true);

    expect(next).toMatchObject({ lastSeq: 2, lastMessage: { seq: 2 }, lastActivityAt: message(2).createdAt, unreadCount: 1 });
  });

  it("keeps the newer preview when an older message arrives late", () => {
    const next = withNewMessage(conversation("c1", { lastSeq: 5, lastMessage: message(5) }), message(3), false);

    expect(next).toMatchObject({ lastSeq: 5, lastMessage: { seq: 5 }, unreadCount: 0 });
  });
});

describe("withoutMessageContent", () => {
  it("blanks a deleted message", () => {
    expect(withoutMessageContent(message(1, { code: "x", codeLanguage: "ts" }), "m1")).toMatchObject({
      deleted: true,
      body: null,
      code: null,
      codeLanguage: null,
    });
  });

  it("blanks the quoted preview of a reply to a deleted message", () => {
    const reply = message(2, { replyTo: { id: "m1", seq: 1, senderName: "Ada", preview: "secret", deleted: false } });

    expect(withoutMessageContent(reply, "m1").replyTo).toEqual({ id: "m1", seq: 1, senderName: "Ada", preview: null, deleted: true });
    expect(withoutMessageContent(reply, "m1").body).toBe("message 2");
  });

  it("returns unrelated messages untouched", () => {
    const other = message(3);

    expect(withoutMessageContent(other, "m1")).toBe(other);
  });
});
