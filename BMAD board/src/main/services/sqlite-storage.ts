import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Project, NewProject } from '../../shared/ipc-channels';
import logger from '../logger';

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    epicsDir: row.epics_dir as string,
    storiesDir: row.stories_dir as string,

    lastUsedAt: row.last_used_at as string | null,
    createdAt: row.created_at as string,
  };
}

export class SqliteStorage {
  private db: Database.Database | null = null;
  private stmts: Record<string, Database.Statement | null> = {};

  readonly mode = 'sqlite' as const;

  private static readonly SCHEMA_VERSION = 1;

  constructor() {
    const dbPath = join(app.getPath('userData'), 'bmad-board.db');
    const instance = new Database(dbPath);
    instance.pragma('journal_mode = WAL');

    try {
      this.initSchema(instance);
    } catch (err) {
      instance.close();
      throw err;
    }

    this.db = instance;
    try {
      this.prepareStatements();
      this.runMigrations();
    } catch (err) {
      instance.close();
      this.db = null;
      throw err;
    }
    logger.info('[Storage] Mode: sqlite');
  }

  private initSchema(instance: Database.Database): void {
    instance.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        epics_dir TEXT NOT NULL,
        stories_dir TEXT NOT NULL,
        last_used_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private prepareStatements(): void {
    const db = this.db!;

    this.stmts = {
      getProjects: db.prepare('SELECT * FROM projects ORDER BY last_used_at DESC'),
      getProjectById: db.prepare('SELECT * FROM projects WHERE id = ?'),
      insertProject: db.prepare(
        'INSERT INTO projects (id, name, epics_dir, stories_dir, last_used_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ),
      deleteProject: db.prepare('DELETE FROM projects WHERE id = ?'),
      updateProjectLastUsed: db.prepare('UPDATE projects SET last_used_at = ? WHERE id = ?'),
      updateProjectName: db.prepare('UPDATE projects SET name = ? WHERE id = ?'),
      updateProjectEpicsDir: db.prepare('UPDATE projects SET epics_dir = ? WHERE id = ?'),
      updateProjectStoriesDir: db.prepare('UPDATE projects SET stories_dir = ? WHERE id = ?'),
      getPref: db.prepare('SELECT value FROM preferences WHERE key = ?'),
      setPref: db.prepare('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)'),
      getAllPrefs: db.prepare('SELECT key, value FROM preferences'),
      getMaxMigrationVersion: db.prepare('SELECT MAX(version) as version FROM migrations'),
      insertMigration: db.prepare('INSERT INTO migrations (version) VALUES (?)'),
    };
  }

  private runMigrations(): void {
    const db = this.db!;
    const row = this.stmts.getMaxMigrationVersion!.get() as { version: number | null } | undefined;
    const currentVersion = row?.version ?? 0;

    for (let v = currentVersion + 1; v <= SqliteStorage.SCHEMA_VERSION; v++) {
      db.exec(`INSERT OR IGNORE INTO migrations (version) VALUES (${v});`);
      logger.info(`[Storage] Applied migration v${v}`);
    }
  }

  getProjects(): Project[] {
    const rows = this.stmts.getProjects!.all() as Record<string, unknown>[];
    return rows.map(rowToProject);
  }

  getProjectById(id: string): Project | undefined {
    const row = this.stmts.getProjectById!.get(id) as Record<string, unknown> | undefined;
    return row ? rowToProject(row) : undefined;
  }

  addProject(project: NewProject): Project {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.stmts.insertProject!.run(
      id,
      project.name,
      project.epicsDir,
      project.storiesDir,
      now,
      now
    );
    return {
      id,
      name: project.name,
      epicsDir: project.epicsDir,
      storiesDir: project.storiesDir,
      lastUsedAt: now,
      createdAt: now,
    };
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | undefined {
    const existing = this.getProjectById(id);
    if (!existing) return undefined;

    const applyUpdates = this.db!.transaction(() => {
      if (updates.name !== undefined) {
        this.stmts.updateProjectName!.run(updates.name, id);
      }
      if (updates.epicsDir !== undefined) {
        this.stmts.updateProjectEpicsDir!.run(updates.epicsDir, id);
      }
      if (updates.storiesDir !== undefined) {
        this.stmts.updateProjectStoriesDir!.run(updates.storiesDir, id);
      }
      if (updates.lastUsedAt !== undefined) {
        this.stmts.updateProjectLastUsed!.run(updates.lastUsedAt, id);
      }
    });

    applyUpdates();
    return this.getProjectById(id);
  }

  removeProject(id: string): boolean {
    const result = this.stmts.deleteProject!.run(id);
    return result.changes > 0;
  }

  getPref(key: string): string | null {
    const row = this.stmts.getPref!.get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setPref(key: string, value: string): void {
    this.stmts.setPref!.run(key, value);
  }

  getAllPrefs(): Record<string, string> {
    const rows = this.stmts.getAllPrefs!.all() as { key: string; value: string }[];
    const prefs: Record<string, string> = {};
    for (const row of rows) {
      prefs[row.key] = row.value;
    }
    return prefs;
  }

  close(): void {
    if (this.db) {
      for (const key of Object.keys(this.stmts)) {
        this.stmts[key] = null;
      }
      this.db.close();
      this.db = null;
    }
  }
}
