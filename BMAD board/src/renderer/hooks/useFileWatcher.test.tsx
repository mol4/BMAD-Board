import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import React from 'react';
import { useFileWatcher } from './useFileWatcher';

type FileChangedHandler = (payload: { changes: Array<{ path: string; type: string }> }) => void;
type WatcherErrorHandler = (payload: { code: string; message: string; path?: string }) => void;

const { showToastMock, refreshActiveProjectMock, getActiveProjectIdMock } = vi.hoisted(() => {
  return {
    showToastMock: vi.fn(),
    refreshActiveProjectMock: vi.fn().mockResolvedValue(undefined),
    getActiveProjectIdMock: vi.fn().mockReturnValue('proj-1'),
  };
});

let capturedFileChanged: FileChangedHandler | null = null;
let capturedWatcherError: WatcherErrorHandler | null = null;

vi.mock('@/components/Toast', () => {
  return { useToast: () => ({ showToast: showToastMock }) };
});

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/store-manager', () => {
  return {
    storeManager: {
      refreshActiveProject: refreshActiveProjectMock,
      getActiveProjectId: getActiveProjectIdMock,
    },
  };
});

function Probe(): React.ReactElement {
  useFileWatcher();
  return <></>;
}

beforeEach(() => {
  capturedFileChanged = null;
  capturedWatcherError = null;
  showToastMock.mockClear();
  refreshActiveProjectMock.mockClear();
  const api = {
    onFileChanged: vi.fn((cb: FileChangedHandler) => {
      capturedFileChanged = cb;
      return () => {};
    }),
    onWatcherError: vi.fn((cb: WatcherErrorHandler) => {
      capturedWatcherError = cb;
      return () => {};
    }),
    watcherWatch: vi.fn().mockResolvedValue(undefined),
    watcherStop: vi.fn().mockResolvedValue(undefined),
    watcherStatus: vi.fn().mockResolvedValue({ active: true, dirs: ['/d'], fallback: false, pendingCount: 0 }),
  };
  (window as unknown as { electronAPI: typeof api }).electronAPI = api;
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
});

describe('useFileWatcher', () => {
  it('subscribes to file:changed and watcher:error on mount', () => {
    render(<Probe />);
    expect(capturedFileChanged).not.toBeNull();
    expect(capturedWatcherError).not.toBeNull();
  });

  it('calls storeManager.refreshActiveProject on file:changed event when a project is active', async () => {
    render(<Probe />);

    await act(async () => {
      capturedFileChanged!({ changes: [{ path: '/d/file.md', type: 'modified' }] });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(refreshActiveProjectMock).toHaveBeenCalled();
  });

  it('shows a toast on watcher:error with WATCH_DIR_LOST code', () => {
    render(<Probe />);
    act(() => {
      capturedWatcherError!({ code: 'WATCH_DIR_LOST', message: 'lost' });
    });
    expect(showToastMock).toHaveBeenCalledWith('toast.watchDirLost', 'error');
  });

  it('shows a toast on watcher:error with FILE_LOCKED code', () => {
    render(<Probe />);
    act(() => {
      capturedWatcherError!({ code: 'FILE_LOCKED', message: 'locked' });
    });
    expect(showToastMock).toHaveBeenCalledWith('toast.fileLocked', 'error');
  });

  it('shows generic watcher error toast on unknown code', () => {
    render(<Probe />);
    act(() => {
      capturedWatcherError!({ code: 'WATCHER_ERROR', message: 'oops' });
    });
    expect(showToastMock).toHaveBeenCalledWith('toast.watcherError', 'error');
  });

  it('does not refresh when no active project', async () => {
    getActiveProjectIdMock.mockReturnValue(null);
    render(<Probe />);

    await act(async () => {
      capturedFileChanged!({ changes: [{ path: '/d/file.md', type: 'modified' }] });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(refreshActiveProjectMock).not.toHaveBeenCalled();
  });
});
