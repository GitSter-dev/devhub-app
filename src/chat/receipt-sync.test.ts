import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { conversation } from "../../test/chat-fixtures";
import { API, fail, ok, server } from "../../test/server";
import { signIn } from "../../test/signed-in";
import { chatStore } from "./chat-store";
import { receiptSync } from "./receipt-sync";

type Receipt = { conversationId: string; deliveredSeq: number; readSeq: number };

function receiptEndpoint(respond: (attempt: number) => Response = () => ok({})): Receipt[] {
  const receipts: Receipt[] = [];
  server.use(
    http.put(`${API}/conversations/:id/receipts`, async ({ params, request }) => {
      receipts.push({ conversationId: String(params.id), ...((await request.json()) as Omit<Receipt, "conversationId">) });
      return respond(receipts.length);
    }),
  );
  return receipts;
}

describe("receipt sync", () => {
  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
    await chatStore.wipe();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    receiptSync.reset();
    vi.useRealTimers();
  });

  it("batches marks for 800ms and sends only the furthest", async () => {
    const receipts = receiptEndpoint();

    receiptSync.delivered("c1", 3);
    receiptSync.delivered("c1", 7);
    receiptSync.delivered("c1", 5);
    await vi.advanceTimersByTimeAsync(799);
    expect(receipts).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);

    await vi.waitFor(() => expect(receipts).toEqual([{ conversationId: "c1", deliveredSeq: 7, readSeq: 0 }]));
  });

  it("treats anything read as delivered too", async () => {
    const receipts = receiptEndpoint();

    receiptSync.read("c1", 4);
    await vi.advanceTimersByTimeAsync(800);

    await vi.waitFor(() => expect(receipts).toEqual([{ conversationId: "c1", deliveredSeq: 4, readSeq: 4 }]));
  });

  it("does not resend a mark the server already has", async () => {
    const receipts = receiptEndpoint();
    receiptSync.delivered("c1", 4);
    await vi.advanceTimersByTimeAsync(800);
    await vi.waitFor(() => expect(receipts).toHaveLength(1));

    receiptSync.delivered("c1", 3);
    await vi.advanceTimersByTimeAsync(800);

    expect(receipts).toHaveLength(1);
  });

  it("ignores empty conversations", async () => {
    const receipts = receiptEndpoint();

    receiptSync.delivered("c1", 0);
    receiptSync.read("c1", 0);
    await vi.advanceTimersByTimeAsync(800);

    expect(receipts).toEqual([]);
  });

  it("tries again five seconds after a failure", async () => {
    const receipts = receiptEndpoint((attempt) => (attempt === 1 ? fail(403, "FORBIDDEN") : ok({})));

    receiptSync.delivered("c1", 2);
    await vi.advanceTimersByTimeAsync(800);
    await vi.waitFor(() => expect(receipts).toHaveLength(1));
    await vi.advanceTimersByTimeAsync(5_000);

    await vi.waitFor(() => expect(receipts).toHaveLength(2));
  });

  it("drops the unread badge locally as soon as something is read", async () => {
    receiptEndpoint();
    await chatStore.saveConversations([conversation("c1", { lastSeq: 10, unreadCount: 6, myReadSeq: 4 })]);

    receiptSync.read("c1", 8);

    await vi.waitFor(async () =>
      expect(await chatStore.conversation("c1")).toMatchObject({ myReadSeq: 8, unreadCount: 2 }),
    );
  });

  it("never moves the local read mark backwards", async () => {
    receiptEndpoint();
    await chatStore.saveConversations([conversation("c1", { lastSeq: 10, unreadCount: 0, myReadSeq: 10 })]);

    receiptSync.read("c1", 6);
    await vi.advanceTimersByTimeAsync(800);

    expect(await chatStore.conversation("c1")).toMatchObject({ myReadSeq: 10, unreadCount: 0 });
  });

  it("flushes pending marks right away when asked to retry", async () => {
    const receipts = receiptEndpoint();
    receiptSync.delivered("c1", 2);

    receiptSync.retry();
    await vi.advanceTimersByTimeAsync(0);

    await vi.waitFor(() => expect(receipts).toHaveLength(1));
  });
});
