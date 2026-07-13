import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import Card from '@/components/Card';
import type { Epic } from '@/lib/types';

export default function EpicCard({ epic }: { epic: Epic }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const doneCount = useAppStore((s) =>
    s.stories.filter((st) => st.epicId === epic.id && st.status === 'done').length,
  );
  const totalCount = useAppStore((s) =>
    s.stories.filter((st) => st.epicId === epic.id).length,
  );
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/epics/${epic.id}`);
      }
    },
    [navigate, epic.id],
  );

  return (
    <Card
      role="article"
      aria-label={epic.title}
      tabIndex={0}
      className="p-4 cursor-pointer group"
      onClick={() => navigate(`/epics/${epic.id}`)}
      onKeyDown={handleKeyDown}
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
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${t('common.progress')}: ${progress}%`}
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {(epic.labels?.length ?? 0) > 0 && (
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
