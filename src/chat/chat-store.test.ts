import { beforeEach, describe, expect, it, vi } from "vitest";

import { conversation, message } from "../../test/chat-fixtures";
import { chatStore, type OutgoingRow } from "./chat-store";

function outgoing(clientMessageId: string, conversationId = "c1", createdAt = "2026-09-01T12:00:00.000Z"): OutgoingRow {
  return {
    clientMessageId,
    conversationId,
    body: "hi",
    code: null,
    codeLanguage: null,
    replyToId: null,
    replyPreview: null,
    createdAt,
    state: "pending",
    attempts: 0,
    error: null,
  };
}

describe("chat store", () => {
  beforeEach(async () => {
    await chatStore.wipe();
  });

  it("lists conversations of one status, most recently active first", async () => {
    await chatStore.saveConversations([
      conversation("old", { lastActivityAt: "2026-09-01T10:00:00.000Z" }),
      conversation("new", { lastActivityAt: "2026-09-02T10:00:00.000Z" }),
      conversation("request", { myStatus: "REQUEST" }),
    ]);

    expect((await chatStore.conversations("ACTIVE")).map((c) => c.id)).toEqual(["new", "old"]);
    expect((await chatStore.conversations("REQUEST")).map((c) => c.id)).toEqual(["request"]);
  });

  it("upserts a conversation by id", async () => {
    await chatStore.saveConversations([conversation("c1", { title: "before" })]);
    await chatStore.saveConversations([conversation("c1", { title: "after" })]);

    expect(await chatStore.conversation("c1")).toMatchObject({ title: "after" });
    expect(await chatStore.conversations("ACTIVE")).toHaveLength(1);
  });

  it("keeps messages in seq order and knows the range it holds", async () => {
    await chatStore.saveMessages("c1", [message(3), message(1), message(2)]);

    expect((await chatStore.messages("c1")).map((m) => m.seq)).toEqual([1, 2, 3]);
    expect(await chatStore.latestSeq("c1")).toBe(3);
    expect(await chatStore.oldestSeq("c1")).toBe(1);
    expect(await chatStore.latestSeq("empty")).toBe(0);
    expect(await chatStore.oldestSeq("empty")).toBeNull();
  });

  it("assumes older history exists until the server says otherwise", async () => {
    expect(await chatStore.hasOlder("c1")).toBe(true);

    await chatStore.saveMessages("c1", [message(1)], false);

    expect(await chatStore.hasOlder("c1")).toBe(false);
  });

  it("clears the outbox entry once the server's copy of a sent message arrives", async () => {
    await chatStore.enqueue(outgoing("client-1"));

    await chatStore.saveMessages("c1", [message(1, { clientMessageId: "client-1" })]);

    expect(await chatStore.outgoing("c1")).toEqual([]);
  });

  it("keeps only the newest 200 messages and remembers there is more", async () => {
    await chatStore.saveMessages("c1", Array.from({ length: 205 }, (_, index) => message(index + 1)), false);

    await chatStore.pruneHistory("c1");

    const kept = await chatStore.messages("c1");
    expect(kept).toHaveLength(200);
    expect(kept[0].seq).toBe(6);
    expect(await chatStore.hasOlder("c1")).toBe(true);
  });

  it("leaves short histories alone", async () => {
    await chatStore.saveMessages("c1", [message(1)], false);
    const listener = vi.fn();
    chatStore.onChange(listener);

    await chatStore.pruneHistory("c1");

    expect(await chatStore.hasOlder("c1")).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not lose concurrent read-modify-write updates", async () => {
    await chatStore.saveConversations([conversation("c1")]);

    await Promise.all(
      Array.from({ length: 25 }, () =>
        chatStore.updateConversation("c1", (current) => ({ ...current, unreadCount: current.unreadCount + 1 })),
      ),
    );

    expect(await chatStore.conversation("c1")).toMatchObject({ unreadCount: 25 });
  });

  it("does nothing when updating a conversation it does not have", async () => {
    const listener = vi.fn();
    chatStore.onChange(listener);

    await chatStore.updateConversation("missing", (current) => current);

    expect(listener).not.toHaveBeenCalled();
  });

  it("rewrites only the messages an update actually changed", async () => {
    await chatStore.saveMessages("c1", [message(1), message(2)]);
    const listener = vi.fn();
    chatStore.onChange(listener);

    await chatStore.updateMessages("c1", (m) => (m.seq === 2 ? { ...m, body: "edited" } : m));
    await chatStore.updateMessages("c1", (m) => m);

    expect((await chatStore.messages("c1")).map((m) => m.body)).toEqual(["message 1", "edited"]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("removes a conversation with its messages, history and outbox", async () => {
    await chatStore.saveConversations([conversation("c1")]);
    await chatStore.saveMessages("c1", [message(1)], false);
    await chatStore.enqueue(outgoing("client-1"));

    await chatStore.removeConversation("c1");

    expect(await chatStore.conversation("c1")).toBeNull();
    expect(await chatStore.messages("c1")).toEqual([]);
    expect(await chatStore.hasOlder("c1")).toBe(true);
    expect(await chatStore.outgoing()).toEqual([]);
  });

  it("keeps the outbox in the order messages were written", async () => {
    await chatStore.enqueue(outgoing("b", "c1", "2026-09-01T12:00:02.000Z"));
    await chatStore.enqueue(outgoing("a", "c2", "2026-09-01T12:00:01.000Z"));

    expect((await chatStore.outgoing()).map((row) => row.clientMessageId)).toEqual(["a", "b"]);
    expect((await chatStore.outgoing("c1")).map((row) => row.clientMessageId)).toEqual(["b"]);
  });

  it("round-trips a reply preview and delivery state through the outbox", async () => {
    await chatStore.enqueue({
      ...outgoing("client-1"),
      replyToId: "m1",
      replyPreview: { id: "m1", seq: 1, senderName: "Ada", preview: "hey", deleted: false },
    });

    await chatStore.markOutgoing("client-1", "c1", "failed", 3, "FORBIDDEN");

    expect(await chatStore.outgoing("c1")).toEqual([
      expect.objectContaining({
        replyPreview: { id: "m1", seq: 1, senderName: "Ada", preview: "hey", deleted: false },
        state: "failed",
        attempts: 3,
        error: "FORBIDDEN",
      }),
    ]);
  });

  it("tells listeners which conversation changed", async () => {
    const listener = vi.fn();
    const unsubscribe = chatStore.onChange(listener);

    await chatStore.saveMessages("c1", [message(1)]);
    await chatStore.saveConversations([conversation("c1"), conversation("c2")]);
    unsubscribe();
    await chatStore.saveMessages("c1", [message(2)]);

    expect(listener.mock.calls).toEqual([
      [{ inbox: false, conversationId: "c1" }],
      [{ inbox: true, conversationId: null }],
    ]);
  });
});
