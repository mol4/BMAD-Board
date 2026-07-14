import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('storage (backend selector)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('uses SQLite when better-sqlite3 is available', async () => {
    // Mock electron and better-sqlite3 to succeed
    vi.doMock('electron', () => ({
      app: {
        getPath: () => ':memory:',
      },
    }));

    // Note: better-sqlite3 with ':memory:' path works for in-memory DB
    vi.doMock('better-sqlite3', () => {
      return {
        default: vi.fn().mockImplementation(() => ({
          pragma: vi.fn(),
          exec: vi.fn(),
          prepare: vi.fn().mockReturnValue({
            run: vi.fn().mockReturnValue({ changes: 0 }),
            get: vi.fn().mockReturnValue(null),
            all: vi.fn().mockReturnValue([]),
          }),
          close: vi.fn(),
        })),
      };
    });

    const storage = await import('./storage');
    expect(storage.getStorageMode()).toBe('sqlite');
  });

  it('falls back to JSON when better-sqlite3 throws', async () => {
    vi.doMock('electron', () => ({
      app: {
        getPath: () => '/tmp/test-dir',
      },
    }));

    vi.doMock('better-sqlite3', () => {
      return {
        default: vi.fn().mockImplementation(() => {
          throw new Error('SQLite native module failed to load');
        }),
      };
    });

    const storage = await import('./storage');
    expect(storage.getStorageMode()).toBe('json-fallback');
  });

  it('provides singleton access (same mode on repeated calls)', async () => {
    vi.doMock('electron', () => ({
      app: {
        getPath: () => ':memory:',
      },
    }));

    vi.doMock('better-sqlite3', () => {
      return {
        default: vi.fn().mockImplementation(() => ({
          pragma: vi.fn(),
          exec: vi.fn(),
          prepare: vi.fn().mockReturnValue({
            run: vi.fn().mockReturnValue({ changes: 0 }),
            get: vi.fn().mockReturnValue(null),
            all: vi.fn().mockReturnValue([]),
          }),
          close: vi.fn(),
        })),
      };
    });

    const storage = await import('./storage');
    const mode1 = storage.getStorageMode();
    const mode2 = storage.getStorageMode();
    expect(mode1).toBe('sqlite');
    expect(mode2).toBe('sqlite');
  });

  it('exports all domain methods', async () => {
    vi.doMock('electron', () => ({
      app: {
        getPath: () => ':memory:',
      },
    }));

    vi.doMock('better-sqlite3', () => {
      return {
        default: vi.fn().mockImplementation(() => ({
          pragma: vi.fn(),
          exec: vi.fn(),
          prepare: vi.fn().mockReturnValue({
            run: vi.fn().mockReturnValue({ changes: 0 }),
            get: vi.fn().mockReturnValue(null),
            all: vi.fn().mockReturnValue([]),
          }),
          close: vi.fn(),
        })),
      };
    });

    const storage = await import('./storage');

    expect(typeof storage.getProjects).toBe('function');
    expect(typeof storage.getProjectById).toBe('function');
    expect(typeof storage.addProject).toBe('function');
    expect(typeof storage.updateProject).toBe('function');
    expect(typeof storage.removeProject).toBe('function');
    expect(typeof storage.getPref).toBe('function');
    expect(typeof storage.setPref).toBe('function');
    expect(typeof storage.getAllPrefs).toBe('function');
    expect(typeof storage.closeStorage).toBe('function');
  });
});
