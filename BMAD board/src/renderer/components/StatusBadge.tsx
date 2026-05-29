import { StoryStatus, Priority, EpicStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

const statusStyles: Record<string, { bg: string; text: string }> = {
  backlog: { bg: 'bg-jira-gray-700', text: 'text-gray-300' },
  todo: { bg: 'bg-blue-900/40', text: 'text-blue-400' },
  'in-progress': { bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
  'in-review': { bg: 'bg-purple-900/40', text: 'text-purple-400' },
  done: { bg: 'bg-green-900/40', text: 'text-green-400' },
  draft: { bg: 'bg-jira-gray-700', text: 'text-gray-400' },
  ready: { bg: 'bg-blue-900/40', text: 'text-blue-400' },
};

const priorityStyles: Record<Priority, { color: string; icon: string }> = {
  critical: { color: 'text-red-600', icon: '🔴' },
  high: { color: 'text-orange-500', icon: '🟠' },
  medium: { color: 'text-yellow-500', icon: '🟡' },
  low: { color: 'text-blue-400', icon: '🔵' },
};

export function StatusBadge({ status }: { status: StoryStatus | EpicStatus }) {
  const { t } = useI18n();
  const style = statusStyles[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const label = t(`status.${status}`) || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useI18n();
  const style = priorityStyles[priority];
  const label = t(`priority.${priority}`);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${style.color}`}>
      <span>{style.icon}</span>
      {label}
    </span>
  );
}

export function IssueTypeBadge({ type }: { type: 'epic' | 'story' | 'task' | 'bug' }) {
  const { t } = useI18n();
  const styles: Record<string, { bg: string; icon: string }> = {
    epic: { bg: 'bg-purple-600', icon: '⚡' },
    story: { bg: 'bg-green-600', icon: '📖' },
    task: { bg: 'bg-blue-600', icon: '✅' },
    bug: { bg: 'bg-red-600', icon: '🐛' },
  };
  const s = styles[type];
  const label = t(`issueType.${type}`);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${s.bg}`}>
      <span>{s.icon}</span>
      {label}
    </span>
  );
}
