import { chatApi } from "@/api/chat-api";
import { sessionManager } from "@/session/session-manager";

import { chatStore } from "./chat-store";

const FLUSH_DELAY_MS = 800;
const RETRY_DELAY_MS = 5_000;

type Marks = { delivered: number; read: number };

const wanted = new Map<string, Marks>();
const sent = new Map<string, Marks>();
let timer: ReturnType<typeof setTimeout> | null = null;

function schedule(delay: number): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, delay);
}

async function flush(): Promise<void> {
  let failed = false;
  for (const [conversationId, marks] of [...wanted]) {
    const already = sent.get(conversationId) ?? { delivered: 0, read: 0 };
    if (marks.delivered <= already.delivered && marks.read <= already.read) {
      wanted.delete(conversationId);
      continue;
    }
    try {
      await chatApi.receipts(sessionManager.client, conversationId, marks.delivered, marks.read);
      sent.set(conversationId, {
        delivered: Math.max(already.delivered, marks.delivered),
        read: Math.max(already.read, marks.read),
      });
      if (wanted.get(conversationId) === marks) wanted.delete(conversationId);
    } catch {
      failed = true;
    }
  }
  if (failed) schedule(RETRY_DELAY_MS);
}

function want(conversationId: string, delivered: number, read: number): void {
  const current = wanted.get(conversationId) ?? { delivered: 0, read: 0 };
  wanted.set(conversationId, { delivered: Math.max(current.delivered, delivered, read), read: Math.max(current.read, read) });
  schedule(FLUSH_DELAY_MS);
}

export const receiptSync = {
  delivered(conversationId: string, seq: number): void {
    if (seq > 0) want(conversationId, seq, 0);
  },
  read(conversationId: string, seq: number): void {
    if (seq <= 0) return;
    want(conversationId, seq, seq);
    void chatStore.updateConversation(conversationId, (conversation) =>
      seq <= conversation.myReadSeq
        ? conversation
        : { ...conversation, myReadSeq: seq, unreadCount: Math.max(0, conversation.lastSeq - seq) },
    );
  },
  retry(): void {
    if (wanted.size > 0) schedule(0);
  },
  reset(): void {
    if (timer) clearTimeout(timer);
    timer = null;
    wanted.clear();
    sent.clear();
  },
};
