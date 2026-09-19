import { toApiError, type ApiError } from "@/api/api-error";
import { chatApi, type ChatMessage } from "@/api/chat-api";
import { newIdempotencyKey } from "@/api/idempotency";
import { sessionManager } from "@/session/session-manager";

import { chatStore, type OutgoingRow } from "./chat-store";
import { withNewMessage } from "./conversation-state";

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

export type Draft = {
  body: string | null;
  code: string | null;
  codeLanguage: string | null;
  replyTo: ChatMessage | null;
};

let flushing = false;
let flushAgain = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function isWorthRetrying(error: ApiError): boolean {
  return error.status === 0 || error.status === 429 || error.status >= 500 || error.isConnectivity;
}

function scheduleRetry(attempts: number): void {
  if (retryTimer) return;
  const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1));
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void outgoingQueue.flush();
  }, delay);
}

async function deliver(row: OutgoingRow): Promise<"sent" | "retry" | "failed"> {
  try {
    const message = await chatApi.send(sessionManager.client, row.conversationId, {
      clientMessageId: row.clientMessageId,
      body: row.body,
      code: row.code,
      codeLanguage: row.codeLanguage,
      replyToId: row.replyToId,
    });
    await chatStore.saveMessages(row.conversationId, [message]);
    await chatStore.updateConversation(row.conversationId, (conversation) => withNewMessage(conversation, message, false));
    return "sent";
  } catch (error) {
    const apiError = toApiError(error);
    if (isWorthRetrying(apiError)) {
      await chatStore.markOutgoing(row.clientMessageId, row.conversationId, "pending", row.attempts + 1, null);
      scheduleRetry(row.attempts + 1);
      return "retry";
    }
    await chatStore.markOutgoing(row.clientMessageId, row.conversationId, "failed", row.attempts + 1, apiError.code);
    return "failed";
  }
}

export const outgoingQueue = {
  async send(conversationId: string, draft: Draft): Promise<void> {
    await chatStore.enqueue({
      clientMessageId: newIdempotencyKey(),
      conversationId,
      body: draft.body,
      code: draft.code,
      codeLanguage: draft.codeLanguage,
      replyToId: draft.replyTo?.id ?? null,
      replyPreview: draft.replyTo
        ? {
            id: draft.replyTo.id,
            seq: draft.replyTo.seq,
            senderName: draft.replyTo.sender?.displayName ?? null,
            preview: draft.replyTo.body ?? (draft.replyTo.code ? "Code snippet" : null),
            deleted: draft.replyTo.deleted,
          }
        : null,
      createdAt: new Date().toISOString(),
      state: "pending",
      attempts: 0,
      error: null,
    });
    await outgoingQueue.flush();
  },

  async retry(row: OutgoingRow): Promise<void> {
    await chatStore.markOutgoing(row.clientMessageId, row.conversationId, "pending", 0, null);
    await outgoingQueue.flush();
  },

  async discard(row: OutgoingRow): Promise<void> {
    await chatStore.removeOutgoing(row.clientMessageId, row.conversationId);
  },

  async flush(): Promise<void> {
    if (flushing) {
      flushAgain = true;
      return;
    }
    flushing = true;
    try {
      do {
        flushAgain = false;
        const pending = (await chatStore.outgoing()).filter((row) => row.state === "pending");
        const blocked = new Set<string>();
        for (const row of pending) {
          if (blocked.has(row.conversationId)) continue;
          if ((await deliver(row)) === "retry") blocked.add(row.conversationId);
        }
      } while (flushAgain);
    } finally {
      flushing = false;
    }
  },

  wake(): void {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    void outgoingQueue.flush();
  },

  reset(): void {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
  },
};
