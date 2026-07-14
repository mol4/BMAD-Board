import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileLockManager } from './file-lock';

const { getPathMock } = vi.hoisted(() => ({
  getPathMock: vi.fn(() => '/tmp/bmad-lock-test-default'),
}));

vi.mock('electron', () => ({
  app: {
    getPath: getPathMock,
  },
}));

vi.mock('../logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'bmad-lock-test-'));
}

describe('FileLockManager', () => {
  let manager: FileLockManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = makeTempDir();
    getPathMock.mockReturnValue(tempDir);
    manager = new FileLockManager();
  });

  afterEach(() => {
    manager.stopCleanup();
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  const testPath = '/test/project/stories/4-1-story.md';

  it('acquires a lock for a file path when no lock exists', async () => {
    const result = await manager.acquire(testPath, 'ui');
    expect(result.acquired).toBe(true);
    expect(result.owner).toBe('ui');
  });

  it('releases a lock so it can be re-acquired', async () => {
    await manager.acquire(testPath, 'ui');
    await manager.release(testPath);

    const result = await manager.acquire(testPath, 'agent');
    expect(result.acquired).toBe(true);
    expect(result.owner).toBe('agent');
  });

  it('rejects cross-owner acquisition when lock is held', async () => {
    await manager.acquire(testPath, 'agent');

    const result = await manager.acquire(testPath, 'ui');
    expect(result.acquired).toBe(false);
    expect(result.owner).toBe('agent');
  });

  it('allows same owner to re-acquire an existing lock', async () => {
    await manager.acquire(testPath, 'ui');
    const result = await manager.acquire(testPath, 'ui');
    expect(result.acquired).toBe(true);
    expect(result.owner).toBe('ui');
  });

  it('getStatus returns correct status for active lock', async () => {
    const status1 = await manager.getStatus(testPath);
    expect(status1.acquired).toBe(false);

    await manager.acquire(testPath, 'agent');

    const status2 = await manager.getStatus(testPath);
    expect(status2.acquired).toBe(true);
    expect(status2.owner).toBe('agent');
  });

  it('getStatus returns acquired:false after release', async () => {
    await manager.acquire(testPath, 'ui');
    await manager.release(testPath);

    const status = await manager.getStatus(testPath);
    expect(status.acquired).toBe(false);
  });

  it('releaseStaleLocks releases locks older than maxAgeMs', async () => {
    await manager.acquire(testPath, 'ui');

    const { promises: fsp } = await import('fs');
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update('/test/stale-file.md').digest('hex');
    const lockPath = join(tempDir, 'file-locks', `bmad-lock-${hash}.json`);
    await manager.ensureLockDir();
    await fsp.writeFile(lockPath, JSON.stringify({ owner: 'agent', timestamp: Date.now() - 60000 }), 'utf-8');

    await manager.releaseStaleLocks(30000);

    const status = await manager.getStatus(testPath);
    expect(status.acquired).toBe(true);

    const staleStatus = await manager.getStatus('/test/stale-file.md');
    expect(staleStatus.acquired).toBe(false);
  });

  it('releaseStaleLocks does not release fresh locks', async () => {
    await manager.acquire(testPath, 'agent');

    await manager.releaseStaleLocks(30000);

    const status = await manager.getStatus(testPath);
    expect(status.acquired).toBe(true);
  });

  it('release is idempotent for non-existent lock', async () => {
    await expect(manager.release('/nonexistent/path.md')).resolves.toBeUndefined();
  });
});
