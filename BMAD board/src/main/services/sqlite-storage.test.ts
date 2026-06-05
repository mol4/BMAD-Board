import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const testDir = mkdtempSync(join(tmpdir(), 'sqlite-test-'));

vi.mock('electron', () => ({
  app: {
    getPath: () => testDir,
  },
}));

type MockRecord = Record<string, unknown>;

let mockDbData: MockRecord[] = [];
let mockPrefsData: Record<string, string> = {};

function makeStatementHandlers(sql: string) {
  if (sql.includes('INSERT INTO projects')) {
    return {
      run: vi.fn((...args: unknown[]) => {
        mockDbData.push({
          id: args[0],
          name: args[1],
          epics_dir: args[2],
          stories_dir: args[3],
          stories_mode: args[4],
          last_used_at: args[5],
          created_at: args[6],
        });
        return { changes: 1 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('SELECT * FROM projects ORDER BY last_used_at DESC')) {
    return {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(() =>
        [...mockDbData].sort((a, b) => {
          const aTime = (a.last_used_at as string) ?? '';
          const bTime = (b.last_used_at as string) ?? '';
          return bTime.localeCompare(aTime);
        })
      ),
    };
  }
  if (sql.includes('SELECT * FROM projects WHERE id')) {
    return {
      run: vi.fn(),
      get: vi.fn((id: string) => mockDbData.find((r) => r.id === id) ?? undefined),
      all: vi.fn(),
    };
  }
  if (sql.includes('DELETE FROM projects WHERE id')) {
    return {
      run: vi.fn((id: string) => {
        const idx = mockDbData.findIndex((r) => r.id === id);
        if (idx !== -1) {
          mockDbData.splice(idx, 1);
          return { changes: 1 };
        }
        return { changes: 0 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('UPDATE projects SET last_used_at')) {
    return {
      run: vi.fn((value: string, id: string) => {
        const record = mockDbData.find((r) => r.id === id);
        if (record) record.last_used_at = value;
        return { changes: record ? 1 : 0 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('UPDATE projects SET name')) {
    return {
      run: vi.fn((value: string, id: string) => {
        const record = mockDbData.find((r) => r.id === id);
        if (record) record.name = value;
        return { changes: record ? 1 : 0 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('UPDATE projects SET epics_dir')) {
    return {
      run: vi.fn((value: string, id: string) => {
        const record = mockDbData.find((r) => r.id === id);
        if (record) record.epics_dir = value;
        return { changes: record ? 1 : 0 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('UPDATE projects SET stories_dir')) {
    return {
      run: vi.fn((value: string, id: string) => {
        const record = mockDbData.find((r) => r.id === id);
        if (record) record.stories_dir = value;
        return { changes: record ? 1 : 0 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('UPDATE projects SET stories_mode')) {
    return {
      run: vi.fn((value: string, id: string) => {
        const record = mockDbData.find((r) => r.id === id);
        if (record) record.stories_mode = value;
        return { changes: record ? 1 : 0 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('SELECT value FROM preferences WHERE key')) {
    return {
      run: vi.fn(),
      get: vi.fn((key: string) => {
        const val = mockPrefsData[key];
        return val !== undefined ? { value: val } : undefined;
      }),
      all: vi.fn(),
    };
  }
  if (sql.includes('INSERT OR REPLACE INTO preferences')) {
    return {
      run: vi.fn((key: string, value: string) => {
        mockPrefsData[key] = value;
        return { changes: 1 };
      }),
      get: vi.fn(),
      all: vi.fn(),
    };
  }
  if (sql.includes('SELECT key, value FROM preferences')) {
    return {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(() => Object.entries(mockPrefsData).map(([k, v]) => ({ key: k, value: v }))),
    };
  }
  // Default catch-all for migrations etc.
  return {
    run: vi.fn().mockReturnValue({ changes: 0 }),
    get: vi.fn(() => null),
    all: vi.fn(() => []),
  };
}

const mockPragma = vi.fn();

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    pragma: mockPragma,
    exec: vi.fn(),
    prepare: vi.fn((sql: string) => makeStatementHandlers(sql)),
    transaction: vi.fn((fn: () => void) => fn),
    close: vi.fn(),
  })),
}));

import { SqliteStorage } from './sqlite-storage';

describe('SqliteStorage', () => {
  let storage: SqliteStorage;

  beforeEach(() => {
    mockDbData = [];
    mockPrefsData = {};
    storage = new SqliteStorage();
  });

  afterAll(() => {
    storage?.close();
    try { rmSync(testDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  describe('mode', () => {
    it('reports mode as sqlite', () => {
      expect(storage.mode).toBe('sqlite');
    });
  });

  describe('getProjects / addProject', () => {
    it('returns empty array when no projects exist', () => {
      expect(storage.getProjects()).toEqual([]);
    });

    it('adds a project and returns it with generated id and timestamps', () => {
      const project = storage.addProject({
        name: 'Test Project',
        epicsDir: '/epics',
        storiesDir: '/stories',
        storiesMode: 'flat',
      });

      expect(project.id).toBeTruthy();
      expect(project.name).toBe('Test Project');
      expect(project.epicsDir).toBe('/epics');
      expect(project.storiesDir).toBe('/stories');
      expect(project.storiesMode).toBe('flat');
      expect(project.lastUsedAt).toBeTruthy();
      expect(project.createdAt).toBeTruthy();
      expect(project.createdAt).toBe(project.lastUsedAt);
    });

    it('returns the number of projects added', () => {
      storage.addProject({ name: 'A', epicsDir: '/a', storiesDir: '/sa', storiesMode: 'flat' });
      storage.addProject({ name: 'B', epicsDir: '/b', storiesDir: '/sb', storiesMode: 'nested' });
      expect(storage.getProjects().length).toBe(2);
    });

    it('returns projects sorted with most recently used first after update', () => {
      const p1 = storage.addProject({ name: 'A', epicsDir: '/a', storiesDir: '/sa', storiesMode: 'flat' });
      storage.addProject({ name: 'B', epicsDir: '/b', storiesDir: '/sb', storiesMode: 'flat' });

      storage.updateProject(p1.id, { lastUsedAt: new Date(Date.now() + 10000).toISOString() });

      const projects = storage.getProjects();
      expect(projects[0].id).toBe(p1.id);
    });
  });

  describe('getProjectById', () => {
    it('returns undefined for non-existent project', () => {
      expect(storage.getProjectById('nonexistent')).toBeUndefined();
    });

    it('returns the project by id', () => {
      const created = storage.addProject({
        name: 'Find Me',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'nested',
      });
      const found = storage.getProjectById(created.id);
      expect(found).toEqual(created);
    });
  });

  describe('updateProject', () => {
    it('returns undefined for non-existent project', () => {
      expect(storage.updateProject('nonexistent', { name: 'x' })).toBeUndefined();
    });

    it('updates project name', () => {
      const project = storage.addProject({
        name: 'Original',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'flat',
      });
      const updated = storage.updateProject(project.id, { name: 'Renamed' });
      expect(updated?.name).toBe('Renamed');
      expect(updated?.id).toBe(project.id);
    });

    it('updates multiple fields', () => {
      const project = storage.addProject({
        name: 'Original',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'flat',
      });
      const updated = storage.updateProject(project.id, {
        name: 'New Name',
        epicsDir: '/new-epics',
        storiesDir: '/new-stories',
        storiesMode: 'nested',
      });
      expect(updated).toMatchObject({
        name: 'New Name',
        epicsDir: '/new-epics',
        storiesDir: '/new-stories',
        storiesMode: 'nested',
      });
    });
  });

  describe('removeProject', () => {
    it('returns false for non-existent project', () => {
      expect(storage.removeProject('nonexistent')).toBe(false);
    });

    it('removes an existing project and returns true', () => {
      const project = storage.addProject({
        name: 'To Delete',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'flat',
      });
      expect(storage.removeProject(project.id)).toBe(true);
      expect(storage.getProjectById(project.id)).toBeUndefined();
      expect(storage.getProjects().length).toBe(0);
    });
  });

  describe('getPref / setPref / getAllPrefs', () => {
    it('returns null for unset preference', () => {
      expect(storage.getPref('unknown')).toBeNull();
    });

    it('sets and gets a preference', () => {
      storage.setPref('theme', 'dark');
      expect(storage.getPref('theme')).toBe('dark');
    });

    it('overwrites an existing preference', () => {
      storage.setPref('theme', 'dark');
      storage.setPref('theme', 'light');
      expect(storage.getPref('theme')).toBe('light');
    });

    it('returns all preferences', () => {
      storage.setPref('key1', 'val1');
      storage.setPref('key2', 'val2');
      const all = storage.getAllPrefs();
      expect(all).toEqual({ key1: 'val1', key2: 'val2' });
    });
  });

  describe('WAL mode', () => {
    it('enables WAL journal mode on init', () => {
      expect(mockPragma).toHaveBeenCalledWith('journal_mode = WAL');
    });
  });

  describe('migrations', () => {
    it('runs migrations during construction without error', () => {
      expect(() => new SqliteStorage()).not.toThrow();
    });

    it('is idempotent across multiple constructions', () => {
      const s1 = new SqliteStorage();
      const s2 = new SqliteStorage();
      expect(s1.mode).toBe('sqlite');
      expect(s2.mode).toBe('sqlite');
    });
  });

  describe('close', () => {
    it('closes without error', () => {
      storage.close();
      storage.close();
    });
  });
});
