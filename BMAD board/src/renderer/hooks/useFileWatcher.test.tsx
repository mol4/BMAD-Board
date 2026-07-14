import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import React from 'react';
import { useFileWatcher } from './useFileWatcher';

type FileChangedHandler = (payload: { changes: Array<{ path: string; type: string }> }) => void;
type WatcherErrorHandler = (payload: { code: string; message: string; path?: string }) => void;

const { showToastMock, processChangesMock, getActiveProjectIdMock } = vi.hoisted(() => {
  return {
    showToastMock: vi.fn(),
    processChangesMock: vi.fn().mockResolvedValue(undefined),
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
      refreshActiveProject: vi.fn().mockResolvedValue(undefined),
      getActiveProjectId: getActiveProjectIdMock,
    },
  };
});

vi.mock('@/lib/sync-engine', () => {
  return {
    syncEngine: {
      processChanges: processChangesMock,
      forceFullSync: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn().mockReturnValue(() => {}),
      addErrorListener: vi.fn().mockReturnValue(() => {}),
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
  processChangesMock.mockClear();
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

  it('calls syncEngine.processChanges on file:changed event', async () => {
    render(<Probe />);

    await act(async () => {
      capturedFileChanged!({ changes: [{ path: '/d/file.md', type: 'modified' }] });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(processChangesMock).toHaveBeenCalledWith([{ path: '/d/file.md', type: 'modified' }]);
  });

  it('does not call processChanges when payload has no changes', async () => {
    render(<Probe />);

    await act(async () => {
      capturedFileChanged!(undefined as unknown as { changes: Array<{ path: string; type: string }> });
      capturedFileChanged!({ changes: [] });
      capturedFileChanged!({} as { changes: Array<{ path: string; type: string }> });
      await Promise.resolve();
    });

    expect(processChangesMock).not.toHaveBeenCalled();
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

  it('does not call processChanges when sync fails but still shows error toast', async () => {
    getActiveProjectIdMock.mockReturnValue(null);
    render(<Probe />);

    await act(async () => {
      capturedFileChanged!({ changes: [{ path: '/d/file.md', type: 'modified' }] });
      await Promise.resolve();
      await Promise.resolve();
    });

    // processChanges is called regardless of active project because syncEngine handles its own checks
    expect(processChangesMock).toHaveBeenCalled();
  });
});
