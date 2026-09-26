import { screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/api/query-client";
import { bindChatStore } from "@/chat/chat-queries";
import { chatStore } from "@/chat/chat-store";
import { openConversation } from "@/chat/open-conversation";
import { outgoingQueue } from "@/chat/outgoing-queue";
import { receiptSync } from "@/chat/receipt-sync";
import { lastUserStore } from "@/session/last-user-store";
import ChatScreen from "@/app/(app)/messages/[id]/index";

import { conversation, ME, message } from "../chat-fixtures";
import { setSearchParams } from "../mocks/expo-router";
import { renderScreen } from "../render";
import { API, fail, ok, server } from "../server";
import { signIn } from "../signed-in";

type Sent = { clientMessageId: string; body: string | null; code: string | null; codeLanguage: string | null };

function chatEndpoints(send: (sent: Sent, attempt: number) => Response = (sent) => echo(sent, 3)): Sent[] {
  const sent: Sent[] = [];
  server.use(
    http.get(`${API}/users/me`, () => ok({ ...ME, email: "me@devhub.dev", role: "USER", setupCompleted: true })),
    http.get(`${API}/conversations/c1`, () => ok(conversation("c1", { lastSeq: 2 }))),
    http.get(`${API}/conversations/c1/messages`, () => ok({ items: [message(1), message(2)], hasMore: false })),
    http.put(`${API}/conversations/c1/receipts`, () => ok({ deliveredSeq: 2, readSeq: 2 })),
    http.post(`${API}/conversations/c1/messages`, async ({ request }) => {
      const body = (await request.json()) as Sent;
      sent.push(body);
      return send(body, sent.length);
    }),
  );
  return sent;
}

function echo(sent: Sent, seq: number): Response {
  return ok(message(seq, { sender: ME, body: sent.body, code: sent.code, codeLanguage: sent.codeLanguage, clientMessageId: sent.clientMessageId }));
}

describe("Chat screen", () => {
  let unbind: () => void = () => undefined;

  beforeEach(async () => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    await signIn();
    await chatStore.wipe();
    await chatStore.saveConversations([conversation("c1")]);
    lastUserStore.write({ id: ME.id, username: ME.username, displayName: ME.displayName });
    setSearchParams({ id: "c1" });
    unbind = bindChatStore(queryClient);
  });

  afterEach(() => {
    unbind();
    outgoingQueue.reset();
    receiptSync.reset();
    openConversation.set(null);
  });

  it("opens the conversation, syncs its messages and marks it as the one on screen", async () => {
    chatEndpoints();
    renderScreen(<ChatScreen />);

    expect(await screen.findByText("message 1")).toBeTruthy();
    expect(screen.getByText("message 2")).toBeTruthy();
    expect(screen.getAllByText("Ada").length).toBeGreaterThan(0);
    expect(openConversation.get()).toBe("c1");
  });

  it("sends a trimmed message and shows the server's copy", async () => {
    const sent = chatEndpoints();
    const { user } = renderScreen(<ChatScreen />);
    await screen.findByText("message 2");

    await user.type(screen.getByPlaceholderText("Message"), "   hello there   ");
    await user.click(screen.getByLabelText("Send"));

    expect(await screen.findByText("hello there")).toBeTruthy();
    expect(sent).toEqual([expect.objectContaining({ body: "hello there", code: null, codeLanguage: null })]);
    expect(screen.getByPlaceholderText("Message")).toHaveProperty("value", "");
    await waitFor(async () => expect(await chatStore.outgoing("c1")).toEqual([]));
  });

  it("does not send an empty message", async () => {
    const sent = chatEndpoints();
    const { user } = renderScreen(<ChatScreen />);
    await screen.findByText("message 2");

    await user.type(screen.getByPlaceholderText("Message"), "    ");

    expect(screen.getByLabelText("Send").getAttribute("aria-disabled")).toBe("true");
    expect(sent).toEqual([]);
  });

  it("sends a code block with its language, lowercased", async () => {
    const sent = chatEndpoints();
    const { user } = renderScreen(<ChatScreen />);
    await screen.findByText("message 2");

    await user.click(screen.getByLabelText("Add a code block"));
    await user.type(screen.getByPlaceholderText("Paste or write code"), "fn main() {{}");
    await user.type(screen.getByPlaceholderText("language (optional)"), " Rust ");
    await user.click(screen.getByLabelText("Send"));

    await waitFor(() => expect(sent).toEqual([expect.objectContaining({ body: null, code: "fn main() {}", codeLanguage: "rust" })]));
  });

  it("refuses a language name with spaces", async () => {
    const sent = chatEndpoints();
    const { user } = renderScreen(<ChatScreen />);
    await screen.findByText("message 2");

    await user.click(screen.getByLabelText("Add a code block"));
    await user.type(screen.getByPlaceholderText("Paste or write code"), "x");
    await user.type(screen.getByPlaceholderText("language (optional)"), "c sharp");

    expect(screen.getByLabelText("Send").getAttribute("aria-disabled")).toBe("true");
    await user.clear(screen.getByPlaceholderText("language (optional)"));
    expect(screen.getByLabelText("Send").getAttribute("aria-disabled")).not.toBe("true");
    expect(sent).toEqual([]);
  });

  it("keeps a message on screen while the server is down and delivers it on retry", async () => {
    const sent = chatEndpoints((body, attempt) => (attempt === 1 ? fail(503, "INTERNAL_ERROR") : echo(body, 3)));
    const { user } = renderScreen(<ChatScreen />);
    await screen.findByText("message 2");

    await user.type(screen.getByPlaceholderText("Message"), "are you there?");
    await user.click(screen.getByLabelText("Send"));

    expect(await screen.findByText("are you there?")).toBeTruthy();
    await waitFor(() => expect(sent).toHaveLength(2), { timeout: 3_000 });
    expect(sent[1].clientMessageId).toBe(sent[0].clientMessageId);
    await waitFor(async () => expect(await chatStore.outgoing("c1")).toEqual([]));
    expect(screen.getAllByText("are you there?")).toHaveLength(1);
  });
});
