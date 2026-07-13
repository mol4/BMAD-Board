import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import EpicsPage from './EpicsPage';

vi.mock('marked', () => ({
  default: {
    setOptions: vi.fn(),
    parse: vi.fn().mockReturnValue('<p>content</p>'),
    parseInline: vi.fn().mockReturnValue('content'),
  },
  marked: {
    setOptions: vi.fn(),
    parse: vi.fn().mockReturnValue('<p>content</p>'),
    parseInline: vi.fn().mockReturnValue('content'),
  },
}));

describe('EpicsPage', () => {
  beforeEach(() => {
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
  });

  it('does not render create epic button', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicsPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Create Epic')).not.toBeInTheDocument();
    expect(screen.queryByText('Создать эпик')).not.toBeInTheDocument();
  });

  it('renders epic list when epics exist', () => {
    const store = useAppStore.getState();
    store.createEpic({ title: 'Test Epic', description: 'A test epic' });

    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicsPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Test Epic')).toBeInTheDocument();
  });

  it('renders empty state when no epics exist', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicsPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Epics')).toBeInTheDocument();
  });

  it('shows no CreateModal button', () => {
    const store = useAppStore.getState();
    store.createEpic({ title: 'Epic', description: '' });

    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicsPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
  });

  it('renders 3-column grid layout', () => {
    const store = useAppStore.getState();
    store.createEpic({ title: 'Epic 1', description: '' });
    store.createEpic({ title: 'Epic 2', description: '' });

    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicsPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    const grid = document.querySelector('.grid-cols-3');
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain('gap-4');
  });

  it('renders EpicCard for each epic', () => {
    const store = useAppStore.getState();
    store.createEpic({ title: 'Alpha', description: 'Alpha desc' });
    store.createEpic({ title: 'Beta', description: 'Beta desc' });

    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicsPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('EPIC-1')).toBeInTheDocument();
    expect(screen.getByText('EPIC-2')).toBeInTheDocument();
  });
});
