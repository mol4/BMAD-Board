import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useAppStore } from '@/lib/store';
import { AppRoutes } from './App';

function renderWithProviders(initialEntries: string[]) {
  useAppStore.getState().setInitialized(true);
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <I18nProvider>
            <AppRoutes />
          </I18nProvider>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe('App', () => {
  it('renders Dashboard page at root route', async () => {
    useAppStore.getState().createEpic({ title: 'Test', description: '' });
    useAppStore.getState().setInitialized(true);
    renderWithProviders(['/']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Project Dashboard' })).toBeInTheDocument();
    });
  });

  it('renders Board page at /board route', async () => {
    renderWithProviders(['/board']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sprint Board' })).toBeInTheDocument();
    });
  });

  it('renders Backlog page at /backlog route', async () => {
    renderWithProviders(['/backlog']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
    });
  });

  it('renders Epics page at /epics route', async () => {
    renderWithProviders(['/epics']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Epics' })).toBeInTheDocument();
    });
  });

  it('renders Story detail page at /stories/:id', async () => {
    renderWithProviders(['/stories/STORY-1']);
    await waitFor(() => {
      expect(screen.getByText('Story not found')).toBeInTheDocument();
    });
  });

  it('renders Docs page at /docs route', async () => {
    renderWithProviders(['/docs']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Project Documents' })).toBeInTheDocument();
    });
  });

  it('renders Diagnostics page at /diagnostics route', async () => {
    renderWithProviders(['/diagnostics']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'BMAD Diagnostics' })).toBeInTheDocument();
    });
  });

  it('renders 404 page for unknown route', async () => {
    renderWithProviders(['/unknown']);
    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
    });
  });
});
