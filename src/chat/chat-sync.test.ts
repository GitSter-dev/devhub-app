import { http } from "msw";
import { AppState } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import { lastUserStore } from "@/session/last-user-store";

import { ADA, conversation, KEN, ME, member, message } from "../../test/chat-fixtures";
import { API, fail, ok, server } from "../../test/server";
import { signIn } from "../../test/signed-in";
import { chatStore } from "./chat-store";
import { chatSync } from "./chat-sync";
import { openConversation } from "./open-conversation";
import { receiptSync } from "./receipt-sync";
import { typing } from "./typing";

type Receipt = { conversationId: string; deliveredSeq: number; readSeq: number };

function receiptEndpoint(): Receipt[] {
  const receipts: Receipt[] = [];
  server.use(
    http.put(`${API}/conversations/:id/receipts`, async ({ params, request }) => {
      const body = (await request.json()) as Omit<Receipt, "conversationId">;
      receipts.push({ conversationId: String(params.id), ...body });
      return ok(body);
    }),
  );
  return receipts;
}

function messagePages(pages: (url: URL) => { items: ReturnType<typeof message>[]; hasMore: boolean }): URL[] {
  const requested: URL[] = [];
  server.use(
    http.get(`${API}/conversations/:id/messages`, ({ request }) => {
      const url = new URL(request.url);
      requested.push(url);
      return ok(pages(url));
    }),
  );
  return requested;
}

describe("chat sync", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
    await chatStore.wipe();
    lastUserStore.write({ id: ME.id, username: ME.username, displayName: ME.displayName });
    receiptEndpoint();
  });

  afterEach(() => {
    receiptSync.reset();
    typing.reset();
    openConversation.set(null);
    queryClient.clear();
    vi.useRealTimers();
  });

  describe("messages", () => {
    it("loads the latest page when nothing is stored yet", async () => {
      const requested = messagePages(() => ({ items: [message(9), message(10)], hasMore: true }));

      await chatSync.syncMessages("c1");

      expect(requested[0].searchParams.toString()).toBe("");
      expect((await chatStore.messages("c1")).map((m) => m.seq)).toEqual([9, 10]);
      expect(await chatStore.hasOlder("c1")).toBe(true);
    });

    it("fills a gap forward from what it already has", async () => {
      await chatStore.saveMessages("c1", [message(1), message(2)]);
      const requested = messagePages((url) =>
        url.searchParams.get("afterSeq") === "2"
          ? { items: [message(3), message(4)], hasMore: true }
          : { items: [message(5)], hasMore: false },
      );

      await chatSync.syncMessages("c1");

      expect(requested.map((url) => url.searchParams.get("afterSeq"))).toEqual(["2", "4"]);
      expect(await chatStore.latestSeq("c1")).toBe(5);
    });

    it("stops after ten pages rather than chase an endless gap", async () => {
      await chatStore.saveMessages("c1", [message(1)]);
      const requested = messagePages((url) => {
        const after = Number(url.searchParams.get("afterSeq"));
        return { items: [message(after + 1)], hasMore: true };
      });

      await chatSync.syncMessages("c1");

      expect(requested).toHaveLength(10);
    });

    it("loads older history before the oldest stored message", async () => {
      await chatStore.saveMessages("c1", [message(50)]);
      const requested = messagePages(() => ({ items: [message(48), message(49)], hasMore: false }));

      await chatSync.loadOlder("c1");

      expect(requested[0].searchParams.get("beforeSeq")).toBe("50");
      expect(await chatStore.oldestSeq("c1")).toBe(48);
      expect(await chatStore.hasOlder("c1")).toBe(false);
    });

    it("swallows network trouble instead of crashing the caller", async () => {
      server.use(http.get(`${API}/conversations/:id/messages`, () => fail(404, "NOT_FOUND")));

      await expect(chatSync.syncMessages("c1")).resolves.toBeUndefined();
    });
  });

  describe("conversations", () => {
    it("stores the inbox and message requests together", async () => {
      server.use(
        http.get(`${API}/conversations`, () => ok({ items: [conversation("c1", { lastSeq: 4 })], nextCursor: null })),
        http.get(`${API}/conversations/requests`, () => ok([conversation("r1", { myStatus: "REQUEST" })])),
      );

      await chatSync.syncInbox();

      expect((await chatStore.conversations("ACTIVE")).map((c) => c.id)).toEqual(["c1"]);
      expect((await chatStore.conversations("REQUEST")).map((c) => c.id)).toEqual(["r1"]);
    });

    it("forgets a conversation the server no longer has", async () => {
      await chatStore.saveConversations([conversation("gone")]);
      server.use(http.get(`${API}/conversations/gone`, () => fail(404, "NOT_FOUND")));

      await chatSync.syncConversation("gone");

      expect(await chatStore.conversation("gone")).toBeNull();
    });

    it("keeps a conversation when fetching it fails for another reason", async () => {
      await chatStore.saveConversations([conversation("c1")]);
      server.use(http.get(`${API}/conversations/c1`, () => fail(403, "FORBIDDEN")));

      await chatSync.syncConversation("c1");

      expect(await chatStore.conversation("c1")).not.toBeNull();
    });
  });

  describe("realtime events", () => {
    it("counts a new message from someone else as unread and marks it delivered", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const receipts = receiptEndpoint();
      await chatStore.saveConversations([conversation("c1", { lastSeq: 1 })]);
      await chatStore.saveMessages("c1", [message(1)]);

      await chatSync.handle({ type: "MESSAGE_CREATED", conversationId: "c1", data: message(2) });
      await vi.advanceTimersByTimeAsync(800);

      expect(await chatStore.conversation("c1")).toMatchObject({ lastSeq: 2, unreadCount: 1 });
      expect((await chatStore.messages("c1")).map((m) => m.seq)).toEqual([1, 2]);
      await vi.waitFor(() => expect(receipts).toEqual([{ conversationId: "c1", deliveredSeq: 2, readSeq: 0 }]));
    });

    it("does not count my own messages as unread", async () => {
      await chatStore.saveConversations([conversation("c1")]);

      await chatSync.handle({ type: "MESSAGE_CREATED", conversationId: "c1", data: message(1, { sender: ME }) });

      expect(await chatStore.conversation("c1")).toMatchObject({ lastSeq: 1, unreadCount: 0 });
    });

    it("marks a message read straight away while the conversation is on screen", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const receipts = receiptEndpoint();
      await chatStore.saveConversations([conversation("c1")]);
      openConversation.set("c1");

      await chatSync.handle({ type: "MESSAGE_CREATED", conversationId: "c1", data: message(1) });
      await vi.advanceTimersByTimeAsync(800);

      expect(await chatStore.conversation("c1")).toMatchObject({ unreadCount: 0, myReadSeq: 1 });
      await vi.waitFor(() => expect(receipts).toEqual([{ conversationId: "c1", deliveredSeq: 1, readSeq: 1 }]));
    });

    it("counts the message as unread when the app is in the background, even on that screen", async () => {
      vi.spyOn(AppState, "currentState", "get").mockReturnValue("background");
      await chatStore.saveConversations([conversation("c1")]);
      openConversation.set("c1");

      await chatSync.handle({ type: "MESSAGE_CREATED", conversationId: "c1", data: message(1) });

      expect(await chatStore.conversation("c1")).toMatchObject({ unreadCount: 1 });
    });

    it("fetches the missing messages when an event skips ahead", async () => {
      await chatStore.saveConversations([conversation("c1", { lastSeq: 1 })]);
      await chatStore.saveMessages("c1", [message(1)]);
      const requested = messagePages((url) =>
        url.searchParams.get("afterSeq") === "1"
          ? { items: [message(2), message(3), message(4)], hasMore: false }
          : { items: [], hasMore: false },
      );

      await chatSync.handle({ type: "MESSAGE_CREATED", conversationId: "c1", data: message(4) });

      expect(requested[0].searchParams.get("afterSeq")).toBe("1");
      expect((await chatStore.messages("c1")).map((m) => m.seq)).toEqual([1, 2, 3, 4]);
    });

    it("fetches a conversation it has never seen", async () => {
      server.use(http.get(`${API}/conversations/new`, () => ok(conversation("new", { lastSeq: 1 }))));

      await chatSync.handle({ type: "MESSAGE_CREATED", conversationId: "new", data: message(1) });

      expect(await chatStore.conversation("new")).toMatchObject({ id: "new" });
    });

    it("blanks a deleted message and the preview that showed it", async () => {
      await chatStore.saveConversations([conversation("c1", { lastMessage: message(1) })]);
      await chatStore.saveMessages("c1", [message(1)]);

      await chatSync.handle({ type: "MESSAGE_DELETED", conversationId: "c1", data: { messageId: "m1" } });

      expect(await chatStore.messages("c1")).toEqual([expect.objectContaining({ deleted: true, body: null })]);
      expect(await chatStore.conversation("c1")).toMatchObject({ lastMessage: { deleted: true, body: null } });
    });

    it("updates the read ticks when someone else reads", async () => {
      await chatStore.saveConversations([
        conversation("c1", { lastSeq: 5, members: [member(ME), member(ADA), member(KEN, { deliveredSeq: 5, readSeq: 5 })] }),
      ]);

      await chatSync.handle({
        type: "RECEIPT_UPDATED",
        conversationId: "c1",
        data: { userId: ADA.id, deliveredSeq: 5, readSeq: 3 },
      });

      expect(await chatStore.conversation("c1")).toMatchObject({ othersDeliveredSeq: 5, othersReadSeq: 3 });
    });

    it("clears my unread count when I read on another device", async () => {
      await chatStore.saveConversations([conversation("c1", { lastSeq: 5, unreadCount: 5 })]);

      await chatSync.handle({
        type: "RECEIPT_UPDATED",
        conversationId: "c1",
        data: { userId: ME.id, deliveredSeq: 5, readSeq: 4 },
      });

      expect(await chatStore.conversation("c1")).toMatchObject({ myReadSeq: 4, unreadCount: 1 });
    });
  });
});
