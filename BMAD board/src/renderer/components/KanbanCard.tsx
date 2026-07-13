import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Story } from '@/lib/types';
import { PriorityBadge } from '@/components/StatusBadge';

interface KanbanCardProps {
  story: Story;
}

export default function KanbanCard({ story }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', story.id);
      e.dataTransfer.effectAllowed = 'move';
      if (e.dataTransfer.setDragImage) {
        const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
        ghost.removeAttribute('data-testid');
        ghost.style.opacity = '0.5';
        ghost.style.transform = 'scale(0.95)';
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        requestAnimationFrame(() => {
          document.body.removeChild(ghost);
        });
      }
    }
    setIsDragging(true);
  }, [story.id]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    navigate(`/stories/${story.id}`);
  }, [navigate, story.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/stories/${story.id}`);
    }
  }, [navigate, story.id]);

  const cardClasses = [
    'bg-surface-elevated border border-border-default rounded-md shadow-card',
    'transition-all duration-80 ease-out cursor-pointer',
    'hover:shadow-card-hover hover:-translate-y-px',
    isDragging ? 'opacity-50 scale-95 cursor-grabbing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      aria-grabbed={isDragging}
      tabIndex={0}
      data-testid={`kanban-card-${story.id}`}
    >
      <div className="p-3">
        <div className="font-mono text-caption text-foreground-tertiary mb-1">
          {story.key}
        </div>
        <div className="text-body text-foreground-primary font-medium mb-2">
          {story.title}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={story.priority} />
          {story.storyPoints !== undefined && (
            <span className="text-caption text-foreground-tertiary bg-surface-sunken rounded px-1.5 py-0.5">
              {story.storyPoints} SP
            </span>
          )}
          {story.assignee && (
            <span className="text-caption text-foreground-secondary">
              {story.assignee}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
