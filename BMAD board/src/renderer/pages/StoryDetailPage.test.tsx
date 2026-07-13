import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/lib/store';
import StoryDetailPage from './StoryDetailPage';

const { fileReadMock, fileWriteMock } = vi.hoisted(() => ({
    fileReadMock: vi.fn(),
    fileWriteMock: vi.fn(),
}));

vi.mock('@/lib/sync-engine', () => ({
    syncEngine: {
        forceFullSync: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/lib/sprint-status-sync', () => ({
    updateSprintStatus: vi.fn().mockResolvedValue(true),
}));

vi.mock('marked', () => ({
    default: {
        setOptions: vi.fn(),
        parse: vi.fn().mockReturnValue('<p>content</p>'),
    },
    marked: {
        setOptions: vi.fn(),
        parse: vi.fn().mockReturnValue('<p>content</p>'),
    },
}));

function setupWindowMock() {
    (window as unknown as { electronAPI: { fileRead: typeof fileReadMock; fileWrite: typeof fileWriteMock } }).electronAPI = {
        fileRead: fileReadMock,
        fileWrite: fileWriteMock,
    };
}

function cleanupWindowMock() {
    delete (window as unknown as { electronAPI?: unknown }).electronAPI;
}

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <ToastProvider>
                {children}
            </ToastProvider>
        </I18nProvider>
    );
}

describe('StoryDetailPage', () => {
    afterEach(() => {
        cleanup();
        cleanupWindowMock();
        useAppStore.getState().clear();
    });

    it('renders story title', async () => {
        const store = useAppStore.getState();
        store.setInitialized(true);
        const epic = store.createEpic({ title: 'Test Epic', description: '' });
        const story = store.createStory({ epicId: epic.id, title: 'Test Story', description: '' });

        setupWindowMock();
        fileReadMock.mockResolvedValue({ content: story.rawMarkdown ?? '', exists: true });
        fileWriteMock.mockResolvedValue({ mtimeMs: 0 });

        render(
            <MemoryRouter initialEntries={[`/stories/${story.id}`]}>
                <Routes>
                    <Route path="stories/:id" element={<StoryDetailPage />} />
                </Routes>
            </MemoryRouter>,
            { wrapper: Wrapper },
        );

        await waitFor(() => {
            expect(screen.getByText('Test Story')).toBeInTheDocument();
        });
    });

    it('renders "Has file" button when story has sourceFile', async () => {
        const store = useAppStore.getState();
        store.setInitialized(true);
        const epic = store.createEpic({ title: 'Test Epic', description: '' });
        const story = store.createStory({ epicId: epic.id, title: 'Test Story', description: '' });
        store.updateStory(story.id, { sourceFile: '/test/story.md', rawMarkdown: '---\nstatus: backlog\n---\n\n# Content' });

        setupWindowMock();
        fileReadMock.mockResolvedValue({ content: '---\nstatus: backlog\n---\n\n# Content', exists: true });
        fileWriteMock.mockResolvedValue({ mtimeMs: 0 });

        render(
            <MemoryRouter initialEntries={[`/stories/${story.id}`]}>
                <Routes>
                    <Route path="stories/:id" element={<StoryDetailPage />} />
                </Routes>
            </MemoryRouter>,
            { wrapper: Wrapper },
        );

        await waitFor(() => {
            expect(screen.getByText(/Has file|Есть файл/i)).toBeInTheDocument();
        });
    });
});
