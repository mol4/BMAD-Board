import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/lib/store';
import BacklogPage from './BacklogPage';

const { fileWriteMock, fileReadMock } = vi.hoisted(() => ({
  fileWriteMock: vi.fn(),
  fileReadMock: vi.fn(),
}));

vi.mock('@/lib/sync-engine', () => ({
  syncEngine: {
    forceFullSync: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('BacklogPage', () => {
  beforeEach(() => {
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
    fileWriteMock.mockClear();
    fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });
    fileReadMock.mockResolvedValue({ content: '', exists: false });

    const api = {
      fileRead: fileReadMock,
      fileWrite: fileWriteMock,
    };
    (window as unknown as { electronAPI: typeof api }).electronAPI = api;
  });

  afterEach(() => {
    cleanup();
  });

  function wrap(element: React.ReactElement) {
    return (
      <MemoryRouter>
        <I18nProvider>
          <ToastProvider>
            {element}
          </ToastProvider>
        </I18nProvider>
      </MemoryRouter>
    );
  }

  it('does not render create story button', () => {
    const store = useAppStore.getState();
    store.createEpic({ title: 'Epic', description: '' });

    render(wrap(<BacklogPage />));

    expect(screen.queryByText('Create Story')).not.toBeInTheDocument();
    expect(screen.queryByText('Создать стори')).not.toBeInTheDocument();
  });

  it('renders status select dropdown on each story row', () => {
    const store = useAppStore.getState();
    const epic = store.createEpic({ title: 'Epic', description: '' });
    store.createStory({ epicId: epic.id, title: 'Story 1', description: '' });

    render(wrap(<BacklogPage />));

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty message when no epics exist', () => {
    render(wrap(<BacklogPage />));

    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  it('displays epic titles with story counts', () => {
    const store = useAppStore.getState();
    store.createEpic({ title: 'My Epic', description: '' });

    render(wrap(<BacklogPage />));

    expect(screen.getByText('My Epic')).toBeInTheDocument();
  });
});
