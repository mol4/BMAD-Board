import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import Card from '@/components/Card';
import type { Epic } from '@/lib/types';

export default function EpicCard({ epic }: { epic: Epic }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const stories = useAppStore((s) => s.stories);
  const epicStories = useMemo(
    () => stories.filter((s) => s.epicId === epic.id),
    [stories, epic.id],
  );
  const doneCount = epicStories.filter((s) => s.status === 'done').length;
  const progress = epicStories.length > 0 ? Math.round((doneCount / epicStories.length) * 100) : 0;

  return (
    <Card
      role="article"
      aria-label={epic.title}
      className="p-4 cursor-pointer group"
      onClick={() => navigate(`/epics/${epic.id}`)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-caption font-mono bg-accent/10 text-accent rounded-sm px-2 py-0.5">
          {epic.key}
        </span>
      </div>

      <h3 className="text-[16px] font-semibold text-foreground-primary mb-1 group-hover:text-accent transition-colors">
        {epic.title}
      </h3>

      <p className="text-[13px] text-foreground-secondary line-clamp-2 mb-3">
        {epic.description || t('common.noDescription')}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <StatusBadge status={epic.status} />
        <PriorityBadge priority={epic.priority} />
      </div>

      <div className="w-full h-1 bg-surface-sunken rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {epic.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {epic.labels.map((label) => (
            <span
              key={label}
              className="text-caption bg-surface-sunken text-foreground-secondary rounded-sm px-1.5 py-0.5"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
