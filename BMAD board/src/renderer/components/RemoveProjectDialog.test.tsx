import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import RemoveProjectDialog from '@/components/RemoveProjectDialog';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import { storeManager } from '@/lib/store-manager';
import type { Project } from '../../shared/ipc-channels';

const mockProjectRemove = vi.fn();
const mockProjectList = vi.fn();

vi.mock('@/lib/store-manager', () => ({
  storeManager: {
    switchProject: vi.fn(),
    getActiveProjectId: vi.fn(),
  },
}));

const sampleProject: Project = {
  id: 'p-remove',
  name: 'Remove Me',
  epicsDir: '/remove/epics',
  storiesDir: '/remove/stories',
  lastUsedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const otherProject: Project = {
  id: 'p-other',
  name: 'Other Project',
  epicsDir: '/other/epics',
  storiesDir: '/other/stories',
  lastUsedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderDialog(props: Partial<{ isOpen: boolean; onClose: () => void; onRemoved: () => void; project: Project | null }> = {}) {
  const { isOpen = true, onClose = vi.fn(), onRemoved = vi.fn(), project = sampleProject } = props;
  return render(
    <I18nProvider>
      <ToastProvider>
        <RemoveProjectDialog isOpen={isOpen} onClose={onClose} onRemoved={onRemoved} project={project} />
      </ToastProvider>
    </I18nProvider>
  );
}

function setupElectronAPI() {
  (window as Record<string, unknown>).electronAPI = {
    projectRemove: mockProjectRemove,
    projectList: mockProjectList,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete (window as Record<string, unknown>).electronAPI;
  mockProjectRemove.mockResolvedValue(undefined);
  mockProjectList.mockResolvedValue([otherProject]);
  vi.mocked(storeManager.switchProject).mockResolvedValue(undefined);
  vi.mocked(storeManager.getActiveProjectId).mockReturnValue('p-remove');
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, href: '', hash: '' },
  });
});

afterEach(() => {
  cleanup();
});

describe('RemoveProjectDialog', () => {
  describe('rendering', () => {
    it('renders project name and warning text', () => {
      setupElectronAPI();
      renderDialog();

      expect(screen.getByText('Remove Me')).toBeInTheDocument();
      expect(
        screen.getByText('This will remove the project from the app. Your markdown files will NOT be deleted.')
      ).toBeInTheDocument();
    });

    it('does not render when project is null', () => {
      setupElectronAPI();
      renderDialog({ project: null });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('confirm calls projectRemove, shows toast and closes', async () => {
      setupElectronAPI();
      const onClose = vi.fn();
      const onRemoved = vi.fn();
      renderDialog({ onClose, onRemoved });

      fireEvent.click(screen.getByRole('button', { name: /^Remove$/i }));

      await waitFor(() => {
        expect(mockProjectRemove).toHaveBeenCalledWith({ projectId: 'p-remove' });
      });
      expect(screen.getByText('Project removed')).toBeInTheDocument();
      expect(onRemoved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('cancel closes without calling projectRemove', async () => {
      setupElectronAPI();
      const onClose = vi.fn();
      renderDialog({ onClose });

      fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
      expect(mockProjectRemove).not.toHaveBeenCalled();
    });

    it('switches to next project when removed project was active', async () => {
      setupElectronAPI();
      renderDialog();

      fireEvent.click(screen.getByRole('button', { name: /^Remove$/i }));

      await waitFor(() => {
        expect(storeManager.switchProject).toHaveBeenCalledWith('p-other');
      });
    });

    it('redirects to welcome screen when removing last project', async () => {
      setupElectronAPI();
      mockProjectList.mockResolvedValue([]);
      renderDialog();

      fireEvent.click(screen.getByRole('button', { name: /^Remove$/i }));

      await waitFor(() => {
        expect(window.location.hash).toBe('#/welcome');
      });
    });

    it('shows error toast when projectRemove fails', async () => {
      setupElectronAPI();
      mockProjectRemove.mockRejectedValue(new Error('Remove failed'));
      renderDialog();

      fireEvent.click(screen.getByRole('button', { name: /^Remove$/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to remove project')).toBeInTheDocument();
      });
    });
  });

  describe('keyboard behavior', () => {
    it('closes on Escape', async () => {
      setupElectronAPI();
      const onClose = vi.fn();
      renderDialog({ onClose });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('focuses the remove button first', async () => {
      setupElectronAPI();
      renderDialog();

      const removeButton = screen.getByRole('button', { name: /^Remove$/i });
      await waitFor(() => {
        expect(document.activeElement).toBe(removeButton);
      });
    });
  });
});
