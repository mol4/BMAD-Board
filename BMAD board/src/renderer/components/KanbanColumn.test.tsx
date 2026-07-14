import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import KanbanColumn from './KanbanColumn';
import { I18nProvider } from '@/lib/i18n';

function renderColumn(onDrop = vi.fn()) {
  return render(
    <I18nProvider>
      <KanbanColumn status="backlog" count={3} onDrop={onDrop}>
        <div data-testid="child">child content</div>
      </KanbanColumn>
    </I18nProvider>,
  );
}

describe('KanbanColumn', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders children', () => {
    renderColumn();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('displays status label and count', () => {
    renderColumn();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('has role="list" on the story container', () => {
    renderColumn();
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });

  it('has aria-label for status', () => {
    renderColumn();
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label');
  });

  it('applies drop zone styles on drag over', () => {
    renderColumn();
    const column = screen.getByTestId('kanban-column-backlog');
    const dataTransfer = { dropEffect: '' };
    fireEvent.dragOver(column, { preventDefault: vi.fn(), dataTransfer });
    expect(column.className).toContain('border-accent');
    expect(column.className).toContain('bg-accent-subtle');
  });

  it('removes drop zone styles on drop', () => {
    const onDrop = vi.fn();
    renderColumn(onDrop);
    const column = screen.getByTestId('kanban-column-backlog');
    const dataTransfer = { getData: vi.fn().mockReturnValue('story-1'), dropEffect: '' };
    fireEvent.drop(column, { dataTransfer, preventDefault: vi.fn() });
    expect(column.className).toContain('border-transparent');
  });

  it('calls onDrop with story id and status', () => {
    const onDrop = vi.fn();
    renderColumn(onDrop);
    const column = screen.getByTestId('kanban-column-backlog');
    const dataTransfer = { getData: vi.fn().mockReturnValue('story-1'), dropEffect: '' };
    fireEvent.drop(column, { dataTransfer, preventDefault: vi.fn() });
    expect(onDrop).toHaveBeenCalledWith('story-1', 'backlog');
  });

  it('does not call onDrop when data is empty', () => {
    const onDrop = vi.fn();
    renderColumn(onDrop);
    const column = screen.getByTestId('kanban-column-backlog');
    const dataTransfer = { getData: vi.fn().mockReturnValue(''), dropEffect: '' };
    fireEvent.drop(column, { dataTransfer, preventDefault: vi.fn() });
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('renders the status-color top strip', () => {
    renderColumn();
    const column = screen.getByTestId('kanban-column-backlog');
    const strip = column.querySelector('[style*="background-color"]');
    expect(strip).toBeInTheDocument();
  });
});
