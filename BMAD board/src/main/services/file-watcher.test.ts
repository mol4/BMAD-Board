import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { FileWatcher, type FileChangedPayload, type WatcherErrorPayload } from './file-watcher';

vi.mock('../logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'bmad-watcher-'));
}

function captureEmits() {
  const fileChangedCalls: FileChangedPayload[] = [];
  const watcherErrorCalls: WatcherErrorPayload[] = [];
  const emit = {
    fileChanged: vi.fn((payload: FileChangedPayload) => {
      fileChangedCalls.push(payload);
    }),
    watcherError: vi.fn((payload: WatcherErrorPayload) => {
      watcherErrorCalls.push(payload);
    }),
  };
  return { emit, fileChangedCalls, watcherErrorCalls };
}

async function waitForCondition(
  condition: () => boolean,
  timeoutMs = 2000,
  intervalMs = 50,
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start >= timeoutMs) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

describe('FileWatcher', () => {
  let dirs: string[] = [];

  beforeEach(() => {
    vi.useRealTimers();
    dirs = [];
  });

  afterEach(() => {
    for (const d of dirs) {
      try { rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
    }
    vi.clearAllMocks();
  });

  function makeDir(): string {
    const d = makeTempDir();
    dirs.push(d);
    return d;
  }

  it('emits a file:changed event after the debounce window when a file changes', async () => {
    const dir = makeDir();
    const { emit, fileChangedCalls } = captureEmits();
    const watcher = new FileWatcher({ emit, debounceMs: 100, preferFallback: false });
    watcher.start([dir]);

    await new Promise((r) => setTimeout(r, 100));
    writeFileSync(join(dir, 'note.md'), 'hello');

    await waitForCondition(() => fileChangedCalls.length >= 1, 3000);

    const last = fileChangedCalls[fileChangedCalls.length - 1];
    expect(last.changes.length).toBeGreaterThanOrEqual(1);
    const change = last.changes.find((c) => c.path.endsWith('note.md'));
    expect(change).toBeDefined();
    expect(['created', 'modified']).toContain(change!.type);

    watcher.stop();
  });

  it('collapses duplicate rapid events for the same file into one pending change', async () => {
    const dir = makeDir();
    const { emit, fileChangedCalls } = captureEmits();
    const watcher = new FileWatcher({ emit, debounceMs: 150, preferFallback: false });
    watcher.start([dir]);

    await new Promise((r) => setTimeout(r, 100));
    const filePath = join(dir, 'dup.md');
    writeFileSync(filePath, 'a');
    writeFileSync(filePath, 'b');
    writeFileSync(filePath, 'c');

    await waitForCondition(() => fileChangedCalls.length >= 1, 3000);

    const last = fileChangedCalls[fileChangedCalls.length - 1];
    const dupChanges = last.changes.filter((c) => c.path.endsWith('dup.md'));
    expect(dupChanges.length).toBe(1);

    watcher.stop();
  });

  it('produces a single batched event with 3 entries when 3 files change simultaneously', async () => {
    const dir = makeDir();
    const { emit, fileChangedCalls } = captureEmits();
    const watcher = new FileWatcher({ emit, debounceMs: 200, preferFallback: false });
    watcher.start([dir]);

    await new Promise((r) => setTimeout(r, 100));
    writeFileSync(join(dir, 'one.md'), '1');
    writeFileSync(join(dir, 'two.md'), '2');
    writeFileSync(join(dir, 'three.md'), '3');

    await waitForCondition(() => fileChangedCalls.length >= 1, 3000);

    const last = fileChangedCalls[fileChangedCalls.length - 1];
    const names = last.changes.map((c) => c.path.split(/[\\/]/).pop()).sort();
    expect(names).toEqual(['one.md', 'three.md', 'two.md']);

    watcher.stop();
  });

  it('emits watcher:error with WATCH_DIR_LOST when the watched root directory is deleted', async () => {
    const dir = makeDir();
    mkdirSync(dir, { recursive: true });
    const { emit, watcherErrorCalls } = captureEmits();
    const watcher = new FileWatcher({ emit, debounceMs: 100, preferFallback: false });
    watcher.start([dir]);

    await new Promise((r) => setTimeout(r, 100));
    rmSync(dir, { recursive: true, force: true });

    await waitForCondition(() => watcherErrorCalls.some((e) => e.code === 'WATCH_DIR_LOST'), 6000);

    const lost = watcherErrorCalls.find((e) => e.code === 'WATCH_DIR_LOST');
    expect(lost).toBeDefined();
    expect(lost!.path).toBe(dir);

    watcher.stop();
  });

  it('stop() removes watchers and clears pending changes', async () => {
    const dir = makeDir();
    const { emit } = captureEmits();
    const watcher = new FileWatcher({ emit, preferFallback: false });
    watcher.start([dir]);
    expect(watcher.getStatus().active).toBe(true);

    watcher.stop();

    const status = watcher.getStatus();
    expect(status.active).toBe(false);
    expect(status.dirs).toEqual([]);
    expect(status.pendingCount).toBe(0);
  });

  it('deduplicates dirs in start() to prevent watcher leaks', async () => {
    const dir = makeDir();
    const { emit } = captureEmits();
    const watcher = new FileWatcher({ emit, preferFallback: false });
    watcher.start([dir, dir, dir]);
    const status = watcher.getStatus();
    expect(status.dirs.length).toBe(1);
    expect(status.dirs[0]).toBe(dir);
    watcher.stop();
  });

  it('clears pending changes for lost directory', async () => {
    const dir = makeDir();
    mkdirSync(dir, { recursive: true });
    const { emit, fileChangedCalls } = captureEmits();
    const watcher = new FileWatcher({ emit, debounceMs: 5000, preferFallback: false });
    watcher.start([dir]);

    await new Promise((r) => setTimeout(r, 100));
    writeFileSync(join(dir, 'file1.md'), 'content');

    await new Promise((r) => setTimeout(r, 100));
    expect(watcher.getStatus().pendingCount).toBeGreaterThanOrEqual(1);

    rmSync(dir, { recursive: true, force: true });
    await waitForCondition(() => watcher.getStatus().pendingCount === 0, 6000);

    expect(fileChangedCalls.length).toBe(0);

    watcher.stop();
  });
});
