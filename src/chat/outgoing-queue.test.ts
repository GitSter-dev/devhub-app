import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { conversation, ME, message } from "../../test/chat-fixtures";
import { API, fail, ok, server } from "../../test/server";
import { signIn } from "../../test/signed-in";
import { chatStore } from "./chat-store";
import { outgoingQueue } from "./outgoing-queue";

type Sent = { conversationId: string; clientMessageId: string; body: string | null; replyToId: string | null };

function sendEndpoint(respond: (sent: Sent, attempt: number) => Response): Sent[] {
  const sent: Sent[] = [];
  server.use(
    http.post(`${API}/conversations/:id/messages`, async ({ params, request }) => {
      const body = (await request.json()) as Omit<Sent, "conversationId">;
      const entry = { conversationId: String(params.id), ...body };
      sent.push(entry);
      return respond(entry, sent.length);
    }),
  );
  return sent;
}

function echo(sent: Sent, seq: number): Response {
  return ok(message(seq, { sender: ME, body: sent.body, clientMessageId: sent.clientMessageId }));
}

describe("outgoing queue", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
    await chatStore.wipe();
    await chatStore.saveConversations([conversation("c1"), conversation("c2")]);
  });

  afterEach(() => {
    outgoingQueue.reset();
    vi.useRealTimers();
  });

  it("sends a draft with its own idempotent client id and files the server's copy", async () => {
    const sent = sendEndpoint((entry) => echo(entry, 1));

    await outgoingQueue.send("c1", { body: "hello", code: null, codeLanguage: null, replyTo: null });

    expect(sent).toHaveLength(1);
    expect(sent[0].clientMessageId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await chatStore.outgoing()).toEqual([]);
    expect(await chatStore.messages("c1")).toEqual([expect.objectContaining({ body: "hello", seq: 1 })]);
    expect(await chatStore.conversation("c1")).toMatchObject({ lastSeq: 1, unreadCount: 0, lastMessage: { body: "hello" } });
  });

  it("quotes the message being replied to", async () => {
    const sent = sendEndpoint((entry) => echo(entry, 2));

    await outgoingQueue.send("c1", { body: "agreed", code: null, codeLanguage: null, replyTo: message(1) });

    expect(sent[0].replyToId).toBe("m1");
  });

  it("keeps a message pending and retries it after a temporary failure", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const sent = sendEndpoint((entry, attempt) => (attempt === 1 ? fail(503, "INTERNAL_ERROR") : echo(entry, 1)));

    await outgoingQueue.send("c1", { body: "hello", code: null, codeLanguage: null, replyTo: null });

    expect(await chatStore.outgoing("c1")).toEqual([expect.objectContaining({ state: "pending", attempts: 1 })]);
    await vi.advanceTimersByTimeAsync(1_000);
    await vi.waitFor(async () => expect(await chatStore.outgoing()).toEqual([]));
    expect(sent.map((entry) => entry.clientMessageId)).toEqual([sent[0].clientMessageId, sent[0].clientMessageId]);
  });

  it("marks a message failed when the server refuses it", async () => {
    sendEndpoint(() => fail(403, "FORBIDDEN", "You can't message this person"));

    await outgoingQueue.send("c1", { body: "hello", code: null, codeLanguage: null, replyTo: null });

    expect(await chatStore.outgoing("c1")).toEqual([
      expect.objectContaining({ state: "failed", attempts: 1, error: "FORBIDDEN" }),
    ]);
  });

  it("holds back later messages in a conversation until the earlier one gets through", async () => {
    let failFirst = true;
    const sent = sendEndpoint((entry, attempt) => {
      if (entry.body === "first" && failFirst) {
        failFirst = false;
        return fail(503, "INTERNAL_ERROR");
      }
      return echo(entry, attempt);
    });
    await chatStore.enqueue(row("a", "c1", "first", "2026-09-01T12:00:01.000Z"));
    await chatStore.enqueue(row("b", "c1", "second", "2026-09-01T12:00:02.000Z"));
    await chatStore.enqueue(row("c", "c2", "elsewhere", "2026-09-01T12:00:03.000Z"));

    await outgoingQueue.flush();

    expect(sent.map((entry) => entry.body)).toEqual(["first", "elsewhere"]);

    await outgoingQueue.flush();

    expect(sent.map((entry) => entry.body)).toEqual(["first", "elsewhere", "first", "second"]);
  });

  it("lets the user retry a failed message or throw it away", async () => {
    sendEndpoint((entry) => echo(entry, 1));
    await chatStore.enqueue({ ...row("a", "c1", "retry me"), state: "failed", attempts: 2, error: "FORBIDDEN" });
    await chatStore.enqueue({ ...row("b", "c1", "discard me"), state: "failed", attempts: 1, error: "FORBIDDEN" });
    const [retried, discarded] = await chatStore.outgoing("c1");

    await outgoingQueue.discard(discarded);
    await outgoingQueue.retry(retried);

    expect(await chatStore.outgoing()).toEqual([]);
    expect((await chatStore.messages("c1")).map((m) => m.body)).toEqual(["retry me"]);
  });

  it("runs a flush requested mid-flush once the current one ends", async () => {
    let release: () => void = () => undefined;
    let firstArrived = false;
    const sent = sendEndpoint((entry, attempt) => echo(entry, attempt));
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post(`${API}/conversations/c1/messages`, async ({ request }) => {
        const body = (await request.json()) as Sent;
        firstArrived = true;
        await gate;
        sent.push({ ...body, conversationId: "c1" });
        return echo(body, 1);
      }),
    );
    await chatStore.enqueue(row("a", "c1", "first"));

    const firstFlush = outgoingQueue.flush();
    await vi.waitFor(() => expect(firstArrived).toBe(true));
    await chatStore.enqueue(row("b", "c2", "queued during flush"));
    await outgoingQueue.flush();
    release();
    await firstFlush;

    expect(sent.map((entry) => entry.body).sort()).toEqual(["first", "queued during flush"]);
    expect(await chatStore.outgoing()).toEqual([]);
  });
});

function row(clientMessageId: string, conversationId: string, body: string, createdAt = new Date().toISOString()) {
  return {
    clientMessageId,
    conversationId,
    body,
    code: null,
    codeLanguage: null,
    replyToId: null,
    replyPreview: null,
    createdAt,
    state: "pending" as const,
    attempts: 0,
    error: null,
  };
}
