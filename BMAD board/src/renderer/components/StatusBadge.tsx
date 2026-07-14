import type { ReactNode } from 'react';
import { Zap, BookOpen, CheckSquare, Bug } from 'lucide-react';
import { StoryStatus, Priority, EpicStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

const statusStyles: Record<string, { bg: string; text: string }> = {
  backlog: { bg: 'bg-status-backlog-bg', text: 'text-status-backlog-fg' },
  todo: { bg: 'bg-status-todo-bg', text: 'text-status-todo-fg' },
  'in-progress': { bg: 'bg-status-in-progress-bg', text: 'text-status-in-progress-fg' },
  'in-review': { bg: 'bg-status-in-review-bg', text: 'text-status-in-review-fg' },
  done: { bg: 'bg-status-done-bg', text: 'text-status-done-fg' },
  draft: { bg: 'bg-status-draft-bg', text: 'text-status-draft-fg' },
  ready: { bg: 'bg-status-ready-bg', text: 'text-status-ready-fg' },
};

const priorityStyles: Record<Priority, { color: string }> = {
  critical: { color: 'text-priority-critical' },
  high: { color: 'text-priority-high' },
  medium: { color: 'text-priority-medium' },
  low: { color: 'text-priority-low' },
};

export function StatusBadge({ status }: { status: StoryStatus | EpicStatus }) {
  const { t } = useI18n();
  const style = statusStyles[status] || { bg: 'bg-status-backlog-bg', text: 'text-status-backlog-fg' };
  const label = t(`status.${status}`) || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption ${style.bg} ${style.text}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useI18n();
  const style = priorityStyles[priority] || { color: 'text-foreground-tertiary' };
  const label = t(`priority.${priority}`) || priority;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md text-caption ${style.color}`}>
      <span className="w-2 h-2 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

export function IssueTypeBadge({ type }: { type: 'epic' | 'story' | 'task' | 'bug' }) {
  const { t } = useI18n();
  const styles: Record<string, { bg: string; text: string; icon: ReactNode }> = {
    epic: { bg: 'bg-status-in-review-bg', text: 'text-status-in-review-fg', icon: <Zap size={14} /> },
    story: { bg: 'bg-status-done-bg', text: 'text-status-done-fg', icon: <BookOpen size={14} /> },
    task: { bg: 'bg-status-todo-bg', text: 'text-status-todo-fg', icon: <CheckSquare size={14} /> },
    bug: { bg: 'bg-destructive', text: 'text-foreground-on-accent', icon: <Bug size={14} /> },
  };
  const s = styles[type];
  const label = t(`issueType.${type}`);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon}
      {label}
    </span>
  );
}
