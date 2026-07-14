import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KanbanCard from './KanbanCard';
import type { Story } from '@/lib/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'story-1',
    key: 'STORY-1',
    epicId: 'epic-1',
    title: 'Test Story',
    description: '',
    acceptanceCriteria: [],
    status: 'backlog',
    priority: 'medium',
    tasks: [],
    labels: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('KanbanCard', () => {
  beforeEach(() => {
    cleanup();
    mockNavigate.mockReset();
  });

  it('renders story key and title', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('STORY-1')).toBeInTheDocument();
    expect(screen.getByText('Test Story')).toBeInTheDocument();
  });

  it('renders story points when present', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory({ storyPoints: 5 })} />
      </MemoryRouter>,
    );
    expect(screen.getByText('5 SP')).toBeInTheDocument();
  });

  it('renders assignee when present', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory({ assignee: 'Alice' })} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('has draggable attribute and ARIA roles', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('kanban-card-story-1');
    expect(card).toHaveAttribute('draggable', 'true');
    expect(card).toHaveAttribute('role', 'listitem');
    expect(card).toHaveAttribute('aria-grabbed', 'false');
  });

  it('sets aria-grabbed to true during drag', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('kanban-card-story-1');
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    fireEvent.dragStart(card, { dataTransfer });
    expect(card).toHaveAttribute('aria-grabbed', 'true');
    fireEvent.dragEnd(card);
    expect(card).toHaveAttribute('aria-grabbed', 'false');
  });

  it('applies drag styles during drag', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('kanban-card-story-1');
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    fireEvent.dragStart(card, { dataTransfer });
    expect(card.className).toContain('opacity-50');
    expect(card.className).toContain('scale-95');
    expect(card.className).toContain('cursor-grabbing');
  });

  it('navigates to story detail on click', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByTestId('kanban-card-story-1'));
    expect(mockNavigate).toHaveBeenCalledWith('/stories/story-1');
  });

  it('navigates on Enter key', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    fireEvent.keyDown(screen.getByTestId('kanban-card-story-1'), { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/stories/story-1');
  });

  it('navigates on Space key', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    fireEvent.keyDown(screen.getByTestId('kanban-card-story-1'), { key: ' ' });
    expect(mockNavigate).toHaveBeenCalledWith('/stories/story-1');
  });

  it('sets dataTransfer on dragStart', () => {
    render(
      <MemoryRouter>
        <KanbanCard story={makeStory()} />
      </MemoryRouter>,
    );
    const card = screen.getByTestId('kanban-card-story-1');
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    fireEvent.dragStart(card, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'story-1');
    expect(dataTransfer.effectAllowed).toBe('move');
  });
});
