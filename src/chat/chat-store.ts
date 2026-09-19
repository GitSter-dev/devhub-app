import type { SQLiteDatabase } from "expo-sqlite";

import type { ChatMessage, Conversation } from "@/api/chat-api";

import { chatDb } from "./chat-db";

const HISTORY_LIMIT = 200;

export type OutgoingState = "pending" | "failed";

export type OutgoingRow = {
  clientMessageId: string;
  conversationId: string;
  body: string | null;
  code: string | null;
  codeLanguage: string | null;
  replyToId: string | null;
  replyPreview: ChatMessage["replyTo"];
  createdAt: string;
  state: OutgoingState;
  attempts: number;
  error: string | null;
};

export type ChatChange = { inbox: boolean; conversationId: string | null };

type ChangeListener = (change: ChatChange) => void;

type OutgoingRecord = {
  client_message_id: string;
  conversation_id: string;
  body: string | null;
  code: string | null;
  code_language: string | null;
  reply_to_id: string | null;
  reply_preview: string | null;
  created_at: string;
  state: OutgoingState;
  attempts: number;
  error: string | null;
};

const listeners = new Set<ChangeListener>();

function changed(change: ChatChange): void {
  listeners.forEach((listener) => listener(change));
}

function toOutgoing(record: OutgoingRecord): OutgoingRow {
  return {
    clientMessageId: record.client_message_id,
    conversationId: record.conversation_id,
    body: record.body,
    code: record.code,
    codeLanguage: record.code_language,
    replyToId: record.reply_to_id,
    replyPreview: record.reply_preview ? (JSON.parse(record.reply_preview) as ChatMessage["replyTo"]) : null,
    createdAt: record.created_at,
    state: record.state,
    attempts: record.attempts,
    error: record.error,
  };
}

async function writeConversation(db: SQLiteDatabase, conversation: Conversation): Promise<void> {
  await db.runAsync(
    `INSERT INTO conversations (id, my_status, last_activity_at, payload) VALUES (?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET my_status = excluded.my_status, last_activity_at = excluded.last_activity_at,
       payload = excluded.payload`,
    conversation.id,
    conversation.myStatus,
    conversation.lastActivityAt,
    JSON.stringify(conversation),
  );
}

export const chatStore = {
  onChange(listener: ChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async conversations(status: Conversation["myStatus"]): Promise<Conversation[]> {
    const rows = await chatDb.getAllAsync<{ payload: string }>(
      "SELECT payload FROM conversations WHERE my_status = ? ORDER BY last_activity_at DESC",
      status,
    );
    return rows.map((row) => JSON.parse(row.payload) as Conversation);
  },

  async conversation(id: string): Promise<Conversation | null> {
    const row = await chatDb.getFirstAsync<{ payload: string }>("SELECT payload FROM conversations WHERE id = ?", id);
    return row ? (JSON.parse(row.payload) as Conversation) : null;
  },

  async saveConversations(conversations: Conversation[]): Promise<void> {
    if (conversations.length === 0) return;
    await chatDb.withExclusiveTransactionAsync(async (tx) => {
      for (const conversation of conversations) await writeConversation(tx, conversation);
    });
    changed({ inbox: true, conversationId: conversations.length === 1 ? conversations[0].id : null });
  },

  async updateConversation(id: string, update: (conversation: Conversation) => Conversation): Promise<void> {
    const current = await chatStore.conversation(id);
    if (!current) return;
    await writeConversation(chatDb, update(current));
    changed({ inbox: true, conversationId: id });
  },

  async removeConversation(id: string): Promise<void> {
    await chatDb.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync("DELETE FROM conversations WHERE id = ?", id);
      await tx.runAsync("DELETE FROM messages WHERE conversation_id = ?", id);
      await tx.runAsync("DELETE FROM message_history WHERE conversation_id = ?", id);
      await tx.runAsync("DELETE FROM outgoing_messages WHERE conversation_id = ?", id);
    });
    changed({ inbox: true, conversationId: id });
  },

  async messages(conversationId: string): Promise<ChatMessage[]> {
    const rows = await chatDb.getAllAsync<{ payload: string }>(
      "SELECT payload FROM messages WHERE conversation_id = ? ORDER BY seq",
      conversationId,
    );
    return rows.map((row) => JSON.parse(row.payload) as ChatMessage);
  },

  async latestSeq(conversationId: string): Promise<number> {
    const row = await chatDb.getFirstAsync<{ seq: number | null }>(
      "SELECT MAX(seq) AS seq FROM messages WHERE conversation_id = ?",
      conversationId,
    );
    return row?.seq ?? 0;
  },

  async oldestSeq(conversationId: string): Promise<number | null> {
    const row = await chatDb.getFirstAsync<{ seq: number | null }>(
      "SELECT MIN(seq) AS seq FROM messages WHERE conversation_id = ?",
      conversationId,
    );
    return row?.seq ?? null;
  },

  async hasOlder(conversationId: string): Promise<boolean> {
    const row = await chatDb.getFirstAsync<{ has_older: number }>(
      "SELECT has_older FROM message_history WHERE conversation_id = ?",
      conversationId,
    );
    return row ? row.has_older === 1 : true;
  },

  async saveMessages(conversationId: string, messages: ChatMessage[], hasOlder?: boolean): Promise<void> {
    await chatDb.withExclusiveTransactionAsync(async (tx) => {
      for (const message of messages) {
        await tx.runAsync(
          `INSERT INTO messages (id, conversation_id, seq, payload) VALUES (?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET payload = excluded.payload`,
          message.id,
          conversationId,
          message.seq,
          JSON.stringify(message),
        );
        if (message.clientMessageId) {
          await tx.runAsync("DELETE FROM outgoing_messages WHERE client_message_id = ?", message.clientMessageId);
        }
      }
      if (hasOlder !== undefined) {
        await tx.runAsync(
          `INSERT INTO message_history (conversation_id, has_older) VALUES (?, ?)
           ON CONFLICT (conversation_id) DO UPDATE SET has_older = excluded.has_older`,
          conversationId,
          hasOlder ? 1 : 0,
        );
      }
    });
    changed({ inbox: false, conversationId });
  },

  async pruneHistory(conversationId: string): Promise<void> {
    const cutoff = await chatDb.getFirstAsync<{ seq: number }>(
      "SELECT seq FROM messages WHERE conversation_id = ? ORDER BY seq DESC LIMIT 1 OFFSET ?",
      conversationId,
      HISTORY_LIMIT,
    );
    if (!cutoff) return;
    await chatDb.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync("DELETE FROM messages WHERE conversation_id = ? AND seq <= ?", conversationId, cutoff.seq);
      await tx.runAsync(
        `INSERT INTO message_history (conversation_id, has_older) VALUES (?, 1)
         ON CONFLICT (conversation_id) DO UPDATE SET has_older = 1`,
        conversationId,
      );
    });
    changed({ inbox: false, conversationId });
  },

  async updateMessages(conversationId: string, update: (message: ChatMessage) => ChatMessage | null): Promise<void> {
    const messages = await chatStore.messages(conversationId);
    const updated = messages.flatMap((message) => {
      const next = update(message);
      return next && next !== message ? [next] : [];
    });
    if (updated.length > 0) await chatStore.saveMessages(conversationId, updated);
  },

  async outgoing(conversationId?: string): Promise<OutgoingRow[]> {
    const rows = conversationId
      ? await chatDb.getAllAsync<OutgoingRecord>(
          "SELECT * FROM outgoing_messages WHERE conversation_id = ? ORDER BY created_at",
          conversationId,
        )
      : await chatDb.getAllAsync<OutgoingRecord>("SELECT * FROM outgoing_messages ORDER BY created_at");
    return rows.map(toOutgoing);
  },

  async enqueue(row: OutgoingRow): Promise<void> {
    await chatDb.runAsync(
      `INSERT INTO outgoing_messages (client_message_id, conversation_id, body, code, code_language, reply_to_id,
         reply_preview, created_at, state, attempts, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.clientMessageId,
      row.conversationId,
      row.body,
      row.code,
      row.codeLanguage,
      row.replyToId,
      row.replyPreview ? JSON.stringify(row.replyPreview) : null,
      row.createdAt,
      row.state,
      row.attempts,
      row.error,
    );
    changed({ inbox: false, conversationId: row.conversationId });
  },

  async markOutgoing(clientMessageId: string, conversationId: string, state: OutgoingState, attempts: number,
                     error: string | null): Promise<void> {
    await chatDb.runAsync(
      "UPDATE outgoing_messages SET state = ?, attempts = ?, error = ? WHERE client_message_id = ?",
      state,
      attempts,
      error,
      clientMessageId,
    );
    changed({ inbox: false, conversationId });
  },

  async removeOutgoing(clientMessageId: string, conversationId: string): Promise<void> {
    await chatDb.runAsync("DELETE FROM outgoing_messages WHERE client_message_id = ?", clientMessageId);
    changed({ inbox: false, conversationId });
  },

  async wipe(): Promise<void> {
    await chatDb.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(
        "DELETE FROM conversations; DELETE FROM messages; DELETE FROM message_history; DELETE FROM outgoing_messages;",
      );
    });
    changed({ inbox: true, conversationId: null });
  },
};
