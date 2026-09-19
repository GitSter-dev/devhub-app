import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "devhub-chat.db";

const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE conversations (
    id TEXT PRIMARY KEY NOT NULL,
    my_status TEXT NOT NULL,
    last_activity_at TEXT NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE INDEX conversations_status_activity ON conversations (my_status, last_activity_at DESC);

  CREATE TABLE messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL,
    seq INTEGER NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE UNIQUE INDEX messages_conversation_seq ON messages (conversation_id, seq);

  CREATE TABLE message_history (
    conversation_id TEXT PRIMARY KEY NOT NULL,
    has_older INTEGER NOT NULL
  );

  CREATE TABLE outgoing_messages (
    client_message_id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL,
    body TEXT,
    code TEXT,
    code_language TEXT,
    reply_to_id TEXT,
    reply_preview TEXT,
    created_at TEXT NOT NULL,
    state TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    error TEXT
  );
  CREATE INDEX outgoing_conversation_created ON outgoing_messages (conversation_id, created_at);
  `,
];

function open(): SQLite.SQLiteDatabase {
  const db = SQLite.openDatabaseSync(DATABASE_NAME);
  db.execSync("PRAGMA journal_mode = WAL;");
  const { user_version: version } = db.getFirstSync<{ user_version: number }>("PRAGMA user_version;") ?? {
    user_version: 0,
  };
  for (let index = version; index < MIGRATIONS.length; index++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[index]);
      db.execSync(`PRAGMA user_version = ${index + 1};`);
    });
  }
  return db;
}

export const chatDb = open();
