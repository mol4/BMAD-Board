import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AddProjectModal from '@/components/AddProjectModal';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import { storeManager } from '@/lib/store-manager';
import type { Project } from '../../shared/ipc-channels';

const mockDialogOpenDirectory = vi.fn();
const mockFileReadDirectory = vi.fn();
const mockProjectList = vi.fn();
const mockProjectAdd = vi.fn();

vi.mock('@/lib/store-manager', () => ({
  storeManager: {
    switchProject: vi.fn(),
    getActiveProjectId: vi.fn(),
  },
}));

const newProject: Project = {
  id: 'p-new',
  name: 'New Project',
  epicsDir: '/fake/epics',
  storiesDir: '/fake/stories',
  lastUsedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderModal(props: Partial<{ isOpen: boolean; onClose: () => void; onAdded: () => void }> = {}) {
  const { isOpen = true, onClose = vi.fn(), onAdded = vi.fn() } = props;
  return render(
    <I18nProvider>
      <ToastProvider>
        <AddProjectModal isOpen={isOpen} onClose={onClose} onAdded={onAdded} />
      </ToastProvider>
    </I18nProvider>
  );
}

function setupElectronAPI() {
  (window as Record<string, unknown>).electronAPI = {
    dialogOpenDirectory: mockDialogOpenDirectory,
    fileReadDirectory: mockFileReadDirectory,
    projectList: mockProjectList,
    projectAdd: mockProjectAdd,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete (window as Record<string, unknown>).electronAPI;
  mockDialogOpenDirectory.mockResolvedValue({ canceled: false, filePaths: ['/fake/path'] });
  mockFileReadDirectory.mockResolvedValue([
    { name: 'epics.md', path: '/fake/path/epics.md', isFile: true },
  ]);
  mockProjectList.mockResolvedValue([]);
  mockProjectAdd.mockResolvedValue(newProject);
  vi.mocked(storeManager.switchProject).mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe('AddProjectModal', () => {
  describe('rendering', () => {
    it('renders form fields when open', () => {
      setupElectronAPI();
      renderModal();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/Project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Planning artifacts directory/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Implementation artifacts directory/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add project$/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      setupElectronAPI();
      renderModal({ isOpen: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('directory picker', () => {
    it('browse button populates epics directory input', async () => {
      setupElectronAPI();
      mockDialogOpenDirectory.mockResolvedValue({ canceled: false, filePaths: ['/chosen/epics'] });
      renderModal();

      const browseButtons = screen.getAllByRole('button', { name: /Browse/i });
      fireEvent.click(browseButtons[0]);

      await waitFor(() => {
        const epicsInput = screen.getByDisplayValue('/chosen/epics');
        expect(epicsInput).toBeInTheDocument();
      });
    });

    it('browse button populates stories directory input', async () => {
      setupElectronAPI();
      mockDialogOpenDirectory.mockResolvedValue({ canceled: false, filePaths: ['/chosen/stories'] });
      renderModal();

      const browseButtons = screen.getAllByRole('button', { name: /Browse/i });
      fireEvent.click(browseButtons[1]);

      await waitFor(() => {
        const storiesInput = screen.getByDisplayValue('/chosen/stories');
        expect(storiesInput).toBeInTheDocument();
      });
    });
  });

  describe('validation', () => {
    it('blocks submit for non-existent directory', async () => {
      setupElectronAPI();
      mockFileReadDirectory.mockRejectedValue(new Error('ENOENT'));
      mockDialogOpenDirectory
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/missing/epics'] })
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/missing/stories'] });

      renderModal();

      const browseButtons = screen.getAllByRole('button', { name: /Browse/i });
      fireEvent.click(browseButtons[0]);
      fireEvent.click(browseButtons[1]);

      await waitFor(() => {
        expect(screen.getAllByText('Directory not found').length).toBeGreaterThanOrEqual(1);
      });

      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: 'Name' } });
      fireEvent.click(screen.getByRole('button', { name: /Add project$/i }));

      await waitFor(() => {
        expect(mockProjectAdd).not.toHaveBeenCalled();
      });
    });

    it('blocks submit for duplicate paths', async () => {
      setupElectronAPI();
      mockDialogOpenDirectory
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/dup/epics'] })
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/dup/stories'] });
      mockProjectList.mockResolvedValue([
        {
          id: 'p-existing',
          name: 'Existing',
          epicsDir: '/dup/epics',
          storiesDir: '/dup/stories',
          lastUsedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);

      renderModal();

      const browseButtons = screen.getAllByRole('button', { name: /Browse/i });
      fireEvent.click(browseButtons[0]);
      fireEvent.click(browseButtons[1]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('/dup/epics')).toBeInTheDocument();
        expect(screen.getByDisplayValue('/dup/stories')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: 'Duplicate' } });
      fireEvent.click(screen.getByRole('button', { name: /Add project$/i }));

      await waitFor(() => {
        expect(screen.getByText('This directory is already used by another project')).toBeInTheDocument();
      });
      expect(mockProjectAdd).not.toHaveBeenCalled();
    });

    it('shows warning when no markdown files are found but allows submit', async () => {
      setupElectronAPI();
      mockFileReadDirectory.mockResolvedValue([]);
      mockDialogOpenDirectory
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/empty/epics'] })
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/empty/stories'] });

      renderModal();

      const browseButtons = screen.getAllByRole('button', { name: /Browse/i });
      fireEvent.click(browseButtons[0]);
      fireEvent.click(browseButtons[1]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('/empty/epics')).toBeInTheDocument();
        expect(screen.getByDisplayValue('/empty/stories')).toBeInTheDocument();
        expect(screen.getByText('No markdown files found. Continue anyway?')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: 'Empty' } });
      fireEvent.click(screen.getByRole('button', { name: /Add project$/i }));

      await waitFor(() => {
        expect(mockProjectAdd).toHaveBeenCalledWith({
          name: 'Empty',
          epicsDir: '/empty/epics',
          storiesDir: '/empty/stories',
        });
      });
    });
  });

  describe('submission', () => {
    it('successful add calls projectAdd, switchProject, toast and callbacks', async () => {
      setupElectronAPI();
      mockDialogOpenDirectory
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/ok/epics'] })
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/ok/stories'] });

      const onClose = vi.fn();
      const onAdded = vi.fn();
      renderModal({ onClose, onAdded });

      const browseButtons = screen.getAllByRole('button', { name: /Browse/i });
      fireEvent.click(browseButtons[0]);
      fireEvent.click(browseButtons[1]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('/ok/epics')).toBeInTheDocument();
        expect(screen.getByDisplayValue('/ok/stories')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: 'Ok Project' } });
      fireEvent.click(screen.getByRole('button', { name: /Add project$/i }));

      await waitFor(() => {
      expect(mockProjectAdd).toHaveBeenCalledWith({
        name: 'Ok Project',
        epicsDir: '/ok/epics',
        storiesDir: '/ok/stories',
      });
      });

      expect(storeManager.switchProject).toHaveBeenCalledWith('p-new');
      expect(screen.getByText('Project added')).toBeInTheDocument();
      expect(onAdded).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('shows error toast when projectAdd fails', async () => {
      setupElectronAPI();
      mockProjectAdd.mockRejectedValue(new Error('Add failed'));
      mockDialogOpenDirectory
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/ok/epics'] })
        .mockResolvedValueOnce({ canceled: false, filePaths: ['/ok/stories'] });

      renderModal();

      const browseButtons = screen.getAllByRole('button', { name: /Browse/i });
      fireEvent.click(browseButtons[0]);
      fireEvent.click(browseButtons[1]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('/ok/epics')).toBeInTheDocument();
        expect(screen.getByDisplayValue('/ok/stories')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: 'Fail' } });
      fireEvent.click(screen.getByRole('button', { name: /Add project$/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to add project')).toBeInTheDocument();
      });
    });
  });

  describe('keyboard behavior', () => {
    it('closes on Escape', async () => {
      setupElectronAPI();
      const onClose = vi.fn();
      renderModal({ onClose });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('traps focus on Tab', async () => {
      setupElectronAPI();
      renderModal();

      await waitFor(() => {
        expect(document.activeElement).not.toBe(document.body);
      });

      const firstTabbable = document.activeElement as HTMLElement;

      fireEvent.keyDown(document, { key: 'Tab' });
      await waitFor(() => {
        expect(document.activeElement).not.toBe(firstTabbable);
      });
      const secondTabbable = document.activeElement as HTMLElement;

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(firstTabbable);

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(secondTabbable);
    });
  });
});
