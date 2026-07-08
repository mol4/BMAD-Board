import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { writeStoryStatus } from '@/lib/file-writer';
import type { StoryStatus } from '@/lib/types';

const COLUMNS: StoryStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];

export default function BoardPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const initialized = useAppStore((s) => s.initialized);
  const stories = useAppStore((s) => s.stories);
  const getStoriesByStatus = useAppStore((s) => s.getStoriesByStatus);
  const updateStoryStatus = useAppStore((s) => s.updateStoryStatus);
  const mountedRef = useRef(true);
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleStatusChange = useCallback(async (storyId: string, newStatus: StoryStatus) => {
    if (inFlightRef.current.has(storyId)) return;
    inFlightRef.current.add(storyId);

    try {
      const story = useAppStore.getState().getStory(storyId);
      if (!story) return;

      const previousStatus = story.status;
      updateStoryStatus(storyId, newStatus);

      const result = await writeStoryStatus(story, newStatus);
      if (!result.ok && mountedRef.current) {
        if (result.code === 'FILE_LOCKED') {
          showToast(t('toast.fileLockedByAgent'), 'error');
        } else if (result.code === 'FILE_CHANGED') {
          showToast(t('toast.fileChanged'), 'error');
        } else {
          showToast(t('toast.statusUpdateFailed'), 'error');
        }
        updateStoryStatus(storyId, previousStatus);
        return;
      }

      if (mountedRef.current && result.ok) {
        showToast(t('toast.statusUpdated'), 'success');
      }
    } finally {
      inFlightRef.current.delete(storyId);
    }
  }, [updateStoryStatus, showToast, t]);

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
                  <div key={story.id} className="bg-surface-sunken rounded p-2">
                    <Link
                      to={`/stories/${story.id}`}
                      className="block text-sm hover:bg-accent-subtle transition-colors rounded"
                    >
                      <div className="font-medium text-foreground-primary">{story.title}</div>
                      <div className="text-xs text-foreground-tertiary mt-1">{story.key}</div>
                    </Link>
                    <select
                      value={story.status}
                      onChange={(e) => handleStatusChange(story.id, e.target.value as StoryStatus)}
                      className="mt-2 text-xs bg-surface-elevated border border-border-default rounded px-1.5 py-0.5 text-foreground-primary w-full"
                      aria-label={t('story.changeStatus')}
                    >
                      {COLUMNS.map((s) => (
                        <option key={s} value={s}>{t(`status.${s}`)}</option>
                      ))}
                    </select>
                  </div>
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
