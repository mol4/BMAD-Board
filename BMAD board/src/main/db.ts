import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';

let db: Database.Database | null = null;
let getPrefStmt: Database.Statement | null = null;
let setPrefStmt: Database.Statement | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = join(app.getPath('userData'), 'bmad-board.db');

  const instance = new Database(dbPath);
  instance.pragma('journal_mode = WAL');

  try {
    instance.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      epics_dir TEXT NOT NULL,
      stories_dir TEXT NOT NULL,
      stories_mode TEXT DEFAULT 'flat',
      last_used_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  } catch (err) {
    instance.close();
    throw err;
  }

  db = instance;
  return db;
}

export function closeDb(): void {
  if (db) {
    getPrefStmt = null;
    setPrefStmt = null;
    db.close();
    db = null;
  }
}

export function getPref(key: string): string | null {
  if (!getPrefStmt) getPrefStmt = getDb().prepare('SELECT value FROM preferences WHERE key = ?');
  const row = getPrefStmt.get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setPref(key: string, value: string): void {
  if (!setPrefStmt) setPrefStmt = getDb().prepare('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)');
  setPrefStmt.run(key, value);
}
