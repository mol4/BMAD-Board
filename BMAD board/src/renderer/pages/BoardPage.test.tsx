import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/lib/store';
import BoardPage from './BoardPage';

vi.mock('@/lib/file-writer', () => ({
  writeStoryStatus: vi.fn().mockResolvedValue({ ok: true, mtimeMs: 1 }),
}));

function seedStories() {
  const store = useAppStore.getState();
  const epic = store.createEpic({ title: 'Epic', description: '' });
  store.createStory({ epicId: epic.id, title: 'Backlog Story', description: '' });
  const todoStory = store.createStory({ epicId: epic.id, title: 'Todo Story', description: '' });
  store.updateStoryStatus(todoStory.id, 'todo');
  const doneStory = store.createStory({ epicId: epic.id, title: 'Done Story', description: '' });
  store.updateStoryStatus(doneStory.id, 'done');
}

function renderBoard() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <ToastProvider>
          <BoardPage />
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('BoardPage', () => {
  beforeEach(() => {
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
  });

  it('renders 5 kanban columns', () => {
    renderBoard();
    expect(screen.getByTestId('kanban-column-backlog')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-todo')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-in-review')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-done')).toBeInTheDocument();
  });

  it('displays stories in their respective columns', () => {
    seedStories();
    renderBoard();
    expect(screen.getByText('Backlog Story')).toBeInTheDocument();
    expect(screen.getByText('Todo Story')).toBeInTheDocument();
    expect(screen.getByText('Done Story')).toBeInTheDocument();
  });

  it('renders column counts', () => {
    seedStories();
    renderBoard();
    const backlogCol = screen.getByTestId('kanban-column-backlog');
    expect(backlogCol).toHaveTextContent('1');
  });

  it('renders Select dropdown on each card for keyboard accessibility', () => {
    seedStories();
    renderBoard();
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it('renders loading state when not initialized', () => {
    useAppStore.getState().setInitialized(false);
    renderBoard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('uses flexbox layout', () => {
    renderBoard();
    const container = screen.getByTestId('kanban-column-backlog').parentElement;
    expect(container?.className).toContain('flex');
  });

  it('columns have min-width 280px', () => {
    renderBoard();
    const column = screen.getByTestId('kanban-column-backlog');
    expect(column.className).toContain('min-w-[280px]');
  });

  it('drop triggers optimistic status update', async () => {
    seedStories();
    renderBoard();
    const todoColumn = screen.getByTestId('kanban-column-todo');
    const dataTransfer = {
      getData: vi.fn().mockReturnValue(useAppStore.getState().stories[0].id),
      dropEffect: '',
    };
    fireEvent.drop(todoColumn, { dataTransfer, preventDefault: vi.fn() });
    const story = useAppStore.getState().stories.find(
      (s) => s.id === useAppStore.getState().stories[0].id,
    );
    expect(story?.status).toBe('todo');
  });
});
