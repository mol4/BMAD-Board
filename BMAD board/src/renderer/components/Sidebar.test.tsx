import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/lib/store';
import Sidebar from './Sidebar';

const { forceFullSyncMock } = vi.hoisted(() => ({
  forceFullSyncMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/sync-engine', () => ({
  syncEngine: {
    processChanges: vi.fn().mockResolvedValue(undefined),
    forceFullSync: forceFullSyncMock,
    addEventListener: vi.fn().mockReturnValue(() => {}),
    addErrorListener: vi.fn().mockReturnValue(() => {}),
    get syncing() { return false; },
  },
}));

vi.mock('@/lib/i18n', async () => {
  const actual = await vi.importActual<typeof import('@/lib/i18n')>('@/lib/i18n');
  return actual;
});

function setupWindowMock() {
  (window as unknown as Record<string, unknown>).electronAPI = {
    fileRead: vi.fn().mockResolvedValue({ content: '', exists: false }),
    projectList: vi.fn().mockResolvedValue([]),
    projectRemove: vi.fn().mockResolvedValue(true),
    projectAdd: vi.fn().mockResolvedValue({}),
    projectValidate: vi.fn().mockResolvedValue({ valid: true, epicsCount: 0, storiesCount: 0 }),
    dirExists: vi.fn().mockResolvedValue(true),
    selectDirectory: vi.fn(),
    getLastProjectId: vi.fn().mockReturnValue(null),
    setLastProjectId: vi.fn(),
    onFileChanged: vi.fn().mockReturnValue(() => {}),
    onWatcherError: vi.fn().mockReturnValue(() => {}),
  };
}

function cleanupWindowMock() {
  delete (window as unknown as Record<string, unknown>).electronAPI;
}

function renderSidebar(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <ToastProvider>
          <I18nProvider>
            <Sidebar />
          </I18nProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Sidebar sync button', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
    forceFullSyncMock.mockClear();
    setupWindowMock();
  });

  afterEach(() => {
    cleanupWindowMock();
  });

  it('does not render sync button when no active project', () => {
    renderSidebar();
    expect(screen.queryByText('Sync')).not.toBeInTheDocument();
    expect(screen.queryByText('Синхронизировать')).not.toBeInTheDocument();
  });

  it('renders sync button when active project is set', () => {
    useAppStore.getState().setActiveProject('proj-1');
    renderSidebar();
    expect(screen.getByTitle('Force re-sync all project files')).toBeInTheDocument();
  });

  it('calls forceFullSync on sync button click', () => {
    useAppStore.getState().setActiveProject('proj-1');
    renderSidebar();

    const btn = screen.getByTitle('Force re-sync all project files');
    fireEvent.click(btn);

    expect(forceFullSyncMock).toHaveBeenCalled();
  });

  it('disables button during sync', () => {
    useAppStore.getState().setActiveProject('proj-1');

    let resolveSync: () => void;
    forceFullSyncMock.mockImplementation(
      () => new Promise<void>((resolve) => { resolveSync = resolve; }),
    );

    renderSidebar();
    const btn = screen.getByTitle('Force re-sync all project files');
    fireEvent.click(btn);

    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');

    resolveSync!();
  });

  it('shows sync success toast after forceFullSync resolves', async () => {
    forceFullSyncMock.mockImplementation(() => Promise.resolve(undefined));
    useAppStore.getState().setActiveProject('proj-1');
    renderSidebar();

    const btn = screen.getByTitle('Force re-sync all project files');
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(screen.getByText('Sync complete')).toBeInTheDocument();
    });
  });

  it('shows sync failure toast after forceFullSync rejects', async () => {
    forceFullSyncMock.mockRejectedValue(new Error('sync failed'));
    useAppStore.getState().setActiveProject('proj-1');
    renderSidebar();

    const btn = screen.getByTitle('Force re-sync all project files');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('Sync failed. Check file paths.')).toBeInTheDocument();
    });
  });
});

describe('Sidebar collapse', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
    setupWindowMock();
  });

  afterEach(() => {
    cleanupWindowMock();
  });

  it('starts expanded by default', () => {
    renderSidebar();
    const aside = document.querySelector('aside')!;
    expect(aside.className).toContain('w-[260px]');
  });

  it('starts collapsed when localStorage has bmad-sidebar-collapsed=true', () => {
    localStorage.setItem('bmad-sidebar-collapsed', 'true');
    renderSidebar();
    const aside = document.querySelector('aside')!;
    expect(aside.className).toContain('w-16');
  });

  it('persists collapsed state to localStorage on toggle', async () => {
    renderSidebar();
    const toggle = screen.getByTitle('Collapse');
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(localStorage.getItem('bmad-sidebar-collapsed')).toBe('true');
    });
  });

  it('persists expanded state to localStorage when expanding', async () => {
    localStorage.setItem('bmad-sidebar-collapsed', 'true');
    renderSidebar();
    const toggle = screen.getByTitle('Expand');
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(localStorage.getItem('bmad-sidebar-collapsed')).toBe('false');
    });
  });
});
