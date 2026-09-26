import { describe, expect, it } from "vitest";

import { ADA, conversation, KEN, ME, member, message } from "../../../test/chat-fixtures";
import {
  conversationHandle,
  conversationTitle,
  messagePreview,
  outgoingTick,
  systemText,
  tickFor,
} from "./conversation-display";

describe("conversation display", () => {
  it("titles a direct chat after the other person and a group after its name", () => {
    expect(conversationTitle(conversation("c1"), ME.id)).toBe("Ada");
    expect(conversationHandle(conversation("c1"), ME.id)).toBe("@ada");

    const group = conversation("g1", { kind: "GROUP", title: "Rustaceans", members: [member(ME), member(ADA), member(KEN)] });
    expect(conversationTitle(group, ME.id)).toBe("Rustaceans");
    expect(conversationHandle(group, ME.id)).toBe("3 members");
    expect(conversationTitle({ ...group, title: null }, ME.id)).toBe("Group");
  });

  it("ticks a message as sent, delivered or read from the others' marks", () => {
    const chat = conversation("c1", { othersDeliveredSeq: 5, othersReadSeq: 3 });

    expect(tickFor(message(3), chat)).toBe("read");
    expect(tickFor(message(5), chat)).toBe("delivered");
    expect(tickFor(message(6), chat)).toBe("sent");
    expect(outgoingTick({ state: "failed" } as never)).toBe("failed");
    expect(outgoingTick({ state: "pending" } as never)).toBe("pending");
  });

  it("writes group events from my point of view", () => {
    const added = message(1, { kind: "SYSTEM", sender: null, body: null, system: { type: "MEMBER_ADDED", actor: ME, target: KEN, detail: null } });
    const renamed = message(2, { kind: "SYSTEM", sender: null, body: null, system: { type: "GROUP_RENAMED", actor: ADA, target: null, detail: "Crabs" } });
    const owner = message(3, { kind: "SYSTEM", sender: null, body: null, system: { type: "OWNER_CHANGED", actor: null, target: ME, detail: null } });

    expect(systemText(added, ME.id)).toBe("You added Ken");
    expect(systemText(renamed, ME.id)).toBe("Ada renamed the group to “Crabs”");
    expect(systemText(owner, ME.id)).toBe("You are now the group owner");
    expect(systemText({ ...owner, system: { ...owner.system!, target: KEN } }, ME.id)).toBe("Ken is now the group owner");
  });

  it("previews the last message for the inbox", () => {
    expect(messagePreview(null, ME.id)).toBe("No messages yet");
    expect(messagePreview(message(1, { sender: ME, body: "hi" }), ME.id)).toBe("You: hi");
    expect(messagePreview(message(1, { body: null, code: "fn main() {}" }), ME.id)).toBe("Code snippet");
    expect(messagePreview(message(1, { deleted: true }), ME.id)).toBe("Message deleted");
  });
});
