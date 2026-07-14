import { useState, useCallback, type ReactNode } from 'react';
import type { StoryStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

const statusColors: Record<StoryStatus, string> = {
  backlog: 'var(--color-status-backlog-fg)',
  todo: 'var(--color-status-todo-fg)',
  'in-progress': 'var(--color-status-in-progress-fg)',
  'in-review': 'var(--color-status-in-review-fg)',
  done: 'var(--color-status-done-fg)',
};

interface KanbanColumnProps {
  status: StoryStatus;
  count: number;
  children: ReactNode;
  onDrop: (storyId: string, newStatus: StoryStatus) => void;
}

export default function KanbanColumn({ status, count, children, onDrop }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { t } = useI18n();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const storyId = e.dataTransfer?.getData('text/plain');
    if (storyId) {
      onDrop(storyId, status);
    }
  }, [onDrop, status]);

  const borderColor = statusColors[status] || 'var(--color-border-default)';

  const columnClasses = [
    'flex-1 bg-surface-sunken rounded-lg p-3 min-w-[280px] min-h-[200px]',
    'transition-all duration-200 ease-out',
    isDragOver ? 'border-2 border-dashed border-accent bg-accent-subtle' : 'border-2 border-transparent',
  ].join(' ');

  return (
    <div
      className={columnClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`kanban-column-${status}`}
    >
      <div
        className="h-[3px] rounded-t mb-3"
        style={{ backgroundColor: borderColor }}
      />
      <h3 className="text-caption font-medium uppercase text-foreground-secondary mb-3 flex items-center gap-2">
        {t(`status.${status}`)}
        <span className="bg-surface-elevated text-foreground-tertiary rounded-full px-2 py-0.5 text-caption">
          {count}
        </span>
      </h3>
      <div className="space-y-2" role="list" aria-label={t(`status.${status}`)}>
        {children}
      </div>
    </div>
  );
}
