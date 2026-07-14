import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import React from 'react';
import { useFileLock } from './useFileLock';

const { fileLockMock, fileUnlockMock, fileLockStatusMock } = vi.hoisted(() => ({
  fileLockMock: vi.fn(),
  fileUnlockMock: vi.fn(),
  fileLockStatusMock: vi.fn(),
}));

function Probe({ filePath, onResult }: { filePath: string; onResult: (r: ReturnType<typeof useFileLock>) => void }) {
  const result = useFileLock(filePath);
  React.useEffect(() => {
    onResult(result);
  }, [result, onResult]);
  return React.createElement('div');
}

function setupWindowMock() {
  const api = {
    fileLock: fileLockMock,
    fileUnlock: fileUnlockMock,
    fileLockStatus: fileLockStatusMock,
  };
  (window as unknown as { electronAPI: typeof api }).electronAPI = api;
}

describe('useFileLock', () => {
  beforeEach(() => {
    fileLockMock.mockClear();
    fileUnlockMock.mockClear();
    fileLockStatusMock.mockClear();
    setupWindowMock();
  });

  afterEach(() => {
    cleanup();
  });

  it('returns unlocked state initially when no lock exists', async () => {
    fileLockStatusMock.mockResolvedValue({ acquired: false });

    let result: ReturnType<typeof useFileLock> | null = null;

    await act(async () => {
      render(React.createElement(Probe, { filePath: '/test/file.md', onResult: (r: ReturnType<typeof useFileLock>) => { result = r; } }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result).not.toBeNull();
    expect(result!.locked).toBe(false);
    expect(result!.owner).toBeNull();
  });

  it('returns locked state when lock exists', async () => {
    fileLockStatusMock.mockResolvedValue({ acquired: true, owner: 'agent' });

    let result: ReturnType<typeof useFileLock> | null = null;

    await act(async () => {
      render(React.createElement(Probe, { filePath: '/test/file.md', onResult: (r: ReturnType<typeof useFileLock>) => { result = r; } }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result!.locked).toBe(true);
    expect(result!.owner).toBe('agent');
  });

  it('acquire succeeds and updates state', async () => {
    fileLockStatusMock.mockResolvedValue({ acquired: false });
    fileLockMock.mockResolvedValue({ acquired: true, owner: 'ui' });

    let result: ReturnType<typeof useFileLock> | null = null;

    await act(async () => {
      render(React.createElement(Probe, { filePath: '/test/file.md', onResult: (r: ReturnType<typeof useFileLock>) => { result = r; } }));
      await Promise.resolve();
      await Promise.resolve();
    });

    let acquired = false;
    await act(async () => {
      acquired = await result!.acquire();
      await Promise.resolve();
    });

    expect(acquired).toBe(true);
    expect(fileLockMock).toHaveBeenCalledWith({ path: '/test/file.md', owner: 'ui' });
  });

  it('acquire fails when lock is held by another owner', async () => {
    fileLockStatusMock.mockResolvedValue({ acquired: true, owner: 'agent' });
    fileLockMock.mockResolvedValue({ acquired: false, owner: 'agent' });

    let result: ReturnType<typeof useFileLock> | null = null;

    await act(async () => {
      render(React.createElement(Probe, { filePath: '/test/file.md', onResult: (r: ReturnType<typeof useFileLock>) => { result = r; } }));
      await Promise.resolve();
      await Promise.resolve();
    });

    let acquired = false;
    await act(async () => {
      acquired = await result!.acquire();
      await Promise.resolve();
    });

    expect(acquired).toBe(false);
  });

  it('release calls electronAPI.fileUnlock', async () => {
    fileLockStatusMock.mockResolvedValue({ acquired: false });

    let result: ReturnType<typeof useFileLock> | null = null;

    await act(async () => {
      render(React.createElement(Probe, { filePath: '/test/file.md', onResult: (r: ReturnType<typeof useFileLock>) => { result = r; } }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await result!.release();
      await Promise.resolve();
    });

    expect(fileUnlockMock).toHaveBeenCalledWith({ path: '/test/file.md' });
  });

  it('does not crash when filePath is null', async () => {
    let result: ReturnType<typeof useFileLock> | null = null;

    await act(async () => {
      render(React.createElement(Probe, { filePath: null as unknown as string, onResult: (r: ReturnType<typeof useFileLock>) => { result = r; } }));
      await Promise.resolve();
    });

    expect(result!.locked).toBe(false);

    let acquired = false;
    await act(async () => {
      acquired = await result!.acquire();
    });
    expect(acquired).toBe(false);
  });
});
