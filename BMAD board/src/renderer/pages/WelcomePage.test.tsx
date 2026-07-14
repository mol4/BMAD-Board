import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/lib/store';
import { AppRoutes } from '@/App';
import Sidebar from '@/components/Sidebar';
import WelcomePage from './WelcomePage';

describe('WelcomePage', () => {
  beforeEach(() => {
    cleanup();
  });

  function renderWelcome() {
    return render(
      <MemoryRouter initialEntries={['/welcome']}>
        <I18nProvider>
          <WelcomePage />
        </I18nProvider>
      </MemoryRouter>,
    );
  }

  it('renders the welcome title', () => {
    renderWelcome();
    expect(screen.getByText('Welcome to BMAD Board')).toBeInTheDocument();
  });

  it('renders 3 steps with titles', () => {
    renderWelcome();
    expect(screen.getByText('Run BMAD AI agents')).toBeInTheDocument();
    expect(screen.getAllByText('Add Project')).toHaveLength(2);
    expect(screen.getByText('View Your Board')).toBeInTheDocument();
  });

  it('renders the Add Project button', () => {
    renderWelcome();
    expect(screen.getByRole('button', { name: 'Add Project' })).toBeInTheDocument();
  });

  it('shows config form when Add Project is clicked', async () => {
    renderWelcome();
    const btn = screen.getByRole('button', { name: 'Add Project' });
    btn.click();
    await waitFor(() => {
      expect(screen.getByText('Save & Load')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Epics directory')).toBeInTheDocument();
    expect(screen.getByLabelText('Stories directory')).toBeInTheDocument();
  });

  it('step icons have aria-hidden', () => {
    renderWelcome();
    const containers = document.querySelectorAll('[aria-hidden="true"]');
    expect(containers.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Sidebar Help nav item', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders Help nav item with CircleHelp icon', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ToastProvider>
            <I18nProvider>
              <Sidebar />
            </I18nProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Help')).toBeInTheDocument();
  });
});

describe('DashboardPage redirect to Welcome', () => {
  beforeEach(() => {
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
  });

  it('redirects to /welcome when store has no epics or stories', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider>
              <AppRoutes />
            </I18nProvider>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to BMAD Board')).toBeInTheDocument();
    });
  });

  it('does NOT redirect when store has at least one epic', async () => {
    const store = useAppStore.getState();
    store.createEpic({ title: 'Test Epic', description: '' });

    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider>
              <AppRoutes />
            </I18nProvider>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Project Dashboard' })).toBeInTheDocument();
    });
  });
});
