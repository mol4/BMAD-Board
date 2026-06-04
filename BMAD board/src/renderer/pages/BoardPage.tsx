import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import type { StoryStatus } from '@/lib/types';

const COLUMNS: StoryStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];

export default function BoardPage() {
  const { t } = useI18n();
  const initialized = useAppStore((s) => s.initialized);
  const stories = useAppStore((s) => s.stories);
  const getStoriesByStatus = useAppStore((s) => s.getStoriesByStatus);

  if (!initialized) {
    return (
      <div className="text-center py-12 text-foreground-tertiary">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t('board.title')}</h1>
      <p className="text-sm text-foreground-secondary mb-6">
        {t('board.updated')}: {new Date().toLocaleTimeString()}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {COLUMNS.map((status) => {
          const columnStories = getStoriesByStatus(status);
          return (
            <div key={status} className="bg-surface-elevated rounded-lg p-3 min-h-[200px]">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground-primary">
                {t(`status.${status}`)}
                <span className="text-foreground-tertiary">({columnStories.length})</span>
              </h3>
              <div className="space-y-2">
                {columnStories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/stories/${story.id}`}
                    className="block bg-surface-sunken rounded p-2 text-sm hover:bg-accent-subtle transition-colors"
                  >
                    <div className="font-medium text-foreground-primary">{story.title}</div>
                    <div className="text-xs text-foreground-tertiary mt-1">{story.key}</div>
                  </Link>
                ))}
                {columnStories.length === 0 && (
                  <p className="text-xs text-foreground-tertiary text-center py-4">{t('common.noDescription')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
