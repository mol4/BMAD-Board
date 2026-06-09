import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/lib/store';
import { storeManager } from '@/lib/store-manager';
import type { Project } from '../../shared/ipc-channels';

const mockProjectList = vi.fn();

vi.mock('@/lib/store-manager', () => ({
  storeManager: {
    switchProject: vi.fn(),
    getActiveProjectId: vi.fn(),
  },
}));

const sampleProjects: Project[] = [
  { id: 'p1', name: 'Project Alpha', epicsDir: '/a/epics', storiesDir: '/a/stories', storiesMode: 'flat', lastUsedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'p2', name: 'Project Beta', epicsDir: '/b/epics', storiesDir: '/b/stories', storiesMode: 'nested', lastUsedAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'p3', name: 'Project Gamma', epicsDir: '/c/epics', storiesDir: '/c/stories', storiesMode: 'flat', lastUsedAt: null, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.getState().clear();
  useAppStore.getState().setInitialized(true);
  delete (window as Record<string, unknown>).electronAPI;
});

afterEach(() => {
  cleanup();
});

function createProjectListMock(projects: Project[]) {
  mockProjectList.mockResolvedValue(projects);
}

function renderProjectSwitcher(collapsed = false, activeProjectId = 'p1') {
  useAppStore.getState().setActiveProject(activeProjectId);
  (window as Record<string, unknown>).electronAPI = {
    projectList: mockProjectList,
  };
  vi.mocked(storeManager.getActiveProjectId).mockReturnValue(activeProjectId);

  return render(
    <I18nProvider>
      <ToastProvider>
        <ProjectSwitcher collapsed={collapsed} />
      </ToastProvider>
    </I18nProvider>
  );
}

describe('ProjectSwitcher', () => {
  describe('rendering', () => {
    it('renders the combobox trigger button', () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher();
      const button = screen.getByRole('combobox');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('shows the active project name in expanded mode', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });
    });

    it('does not show project name text in collapsed mode', () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(true);
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });
  });

  describe('dropdown', () => {
    it('opens dropdown on click and shows project list', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveTextContent('Project Alpha');
      expect(listbox).toHaveTextContent('Project Beta');
      expect(listbox).toHaveTextContent('Project Gamma');
    });

    it('shows "No projects" when project list is empty', async () => {
      createProjectListMock([]);
      renderProjectSwitcher(false, 'p1');
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveTextContent('No projects');
      });
    });

    it('closes dropdown on click outside', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('project switching', () => {
    it('calls storeManager.switchProject on project click', async () => {
      vi.mocked(storeManager.switchProject).mockResolvedValue(undefined);
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Project Beta'));

      await waitFor(() => {
        expect(storeManager.switchProject).toHaveBeenCalledWith('p2');
      });
    });

    it('shows toast on successful switch', async () => {
      vi.mocked(storeManager.switchProject).mockResolvedValue(undefined);
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Project Beta'));

      await waitFor(() => {
        expect(screen.getByText('Project switched')).toBeInTheDocument();
      });
    });

    it('shows error toast on failed switch', async () => {
      vi.mocked(storeManager.switchProject).mockRejectedValue(new Error('Switch failed'));
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Project Beta'));

      await waitFor(() => {
        expect(screen.getByText('Failed to switch project')).toBeInTheDocument();
      });
    });

    it('closes dropdown after successful switch', async () => {
      vi.mocked(storeManager.switchProject).mockResolvedValue(undefined);
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Project Beta'));

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('active project', () => {
    it('marks the active project with aria-selected', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false, 'p1');
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const alphaOption = options.find((o) => o.textContent?.includes('Project Alpha'));
        expect(alphaOption).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('does not mark inactive projects with aria-selected true', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false, 'p1');
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        const betaOption = options.find((o) => o.textContent?.includes('Project Beta'));
        expect(betaOption).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('keyboard navigation', () => {
    it('opens dropdown on ArrowDown when closed', () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.keyDown(button, { key: 'ArrowDown' });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('opens dropdown on Enter when closed', () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('selects project on Enter when focused', async () => {
      vi.mocked(storeManager.switchProject).mockResolvedValue(undefined);
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await waitFor(() => {
        const firstOption = screen.getAllByRole('option')[0];
        expect(firstOption).toHaveAttribute('tabIndex', '0');
      });

      // Navigate to Project Beta (p2) since p1 is already active
      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });

      await waitFor(() => {
        const secondOption = screen.getAllByRole('option')[1];
        expect(secondOption).toHaveAttribute('tabIndex', '0');
      });

      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });

      await waitFor(() => {
        expect(storeManager.switchProject).toHaveBeenCalledWith('p2');
      });
    });

    it('closes dropdown on Escape', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('ARIA attributes', () => {
    it('sets role="listbox" on the dropdown', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('sets aria-label on the trigger button', () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      expect(button).toHaveAttribute('aria-label', 'Project switcher');
    });

    it('sets role="option" on each project item', async () => {
      createProjectListMock(sampleProjects);
      renderProjectSwitcher(false);
      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(3);
      });
    });
  });
});
