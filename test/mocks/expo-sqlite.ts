import { DatabaseSync, type SQLInputValue } from "node:sqlite";

type Params = SQLInputValue[] | [SQLInputValue[]];

function flatten(params: Params): SQLInputValue[] {
  return params.length === 1 && Array.isArray(params[0]) ? params[0] : (params as SQLInputValue[]);
}

export class SQLiteDatabase {
  readonly native: DatabaseSync;

  constructor() {
    this.native = new DatabaseSync(":memory:");
  }

  execSync(sql: string): void {
    this.native.exec(sql);
  }

  getFirstSync<T>(sql: string, ...params: Params): T | null {
    return (this.native.prepare(sql).get(...flatten(params)) as T | undefined) ?? null;
  }

  getAllSync<T>(sql: string, ...params: Params): T[] {
    return this.native.prepare(sql).all(...flatten(params)) as T[];
  }

  runSync(sql: string, ...params: Params): { changes: number; lastInsertRowId: number } {
    const result = this.native.prepare(sql).run(...flatten(params));
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
  }

  withTransactionSync(task: () => void): void {
    this.native.exec("BEGIN");
    try {
      task();
      this.native.exec("COMMIT");
    } catch (error) {
      this.native.exec("ROLLBACK");
      throw error;
    }
  }

  async execAsync(sql: string): Promise<void> {
    this.execSync(sql);
  }

  async getFirstAsync<T>(sql: string, ...params: Params): Promise<T | null> {
    return this.getFirstSync<T>(sql, ...params);
  }

  async getAllAsync<T>(sql: string, ...params: Params): Promise<T[]> {
    return this.getAllSync<T>(sql, ...params);
  }

  async runAsync(sql: string, ...params: Params): Promise<{ changes: number; lastInsertRowId: number }> {
    return this.runSync(sql, ...params);
  }

  async withExclusiveTransactionAsync(task: (tx: SQLiteDatabase) => Promise<void>): Promise<void> {
    this.native.exec("BEGIN EXCLUSIVE");
    try {
      await task(this);
      this.native.exec("COMMIT");
    } catch (error) {
      this.native.exec("ROLLBACK");
      throw error;
    }
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await this.withExclusiveTransactionAsync(() => task());
  }
}

export function openDatabaseSync(): SQLiteDatabase {
  return new SQLiteDatabase();
}
