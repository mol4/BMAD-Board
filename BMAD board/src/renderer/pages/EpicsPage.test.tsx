import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import EpicsPage from './EpicsPage';

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

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
