import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { writeStoryStatus } from '@/lib/file-writer';
import Select from '@/components/Select';
import type { StoryStatus } from '@/lib/types';

const STATUSES: StoryStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];

export default function BacklogPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const initialized = useAppStore((s) => s.initialized);
  const epics = useAppStore((s) => s.epics);
  const stories = useAppStore((s) => s.stories);
  const getStoriesByEpic = useAppStore((s) => s.getStoriesByEpic);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('backlog.title')}</h1>
          <p className="text-sm text-foreground-secondary">
            {t('backlog.storiesInEpics', { stories: stories.length, epics: epics.length })}
          </p>
        </div>
      </div>

      {epics.length === 0 ? (
        <div className="text-center py-12 text-foreground-tertiary">
          <p className="text-lg">{t('backlog.empty')}</p>
          <p className="text-sm mt-2">{t('backlog.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {epics.map((epic) => {
            const epicStories = getStoriesByEpic(epic.id);
            return (
              <div key={epic.id}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-semibold">{epic.title}</h2>
                  <StatusBadge status={epic.status} />
                  <span className="text-sm text-foreground-tertiary">
                    {epicStories.length} {t('backlog.storiesCount')}
                  </span>
                </div>

                {epicStories.length === 0 ? (
                  <p className="text-sm text-foreground-tertiary ml-6">{t('backlog.noStories')}</p>
                ) : (
                  <div className="space-y-2 ml-6">
                    {epicStories.map((story) => (
                      <div
                        key={story.id}
                        className="flex items-center gap-3 p-3 bg-surface-elevated rounded-lg"
                      >
                        <Link
                          to={`/stories/${story.id}`}
                          className="flex-1 hover:bg-accent-subtle transition-colors rounded"
                        >
                          <div className="font-medium text-sm">{story.title}</div>
                          <div className="text-xs text-foreground-tertiary mt-0.5">{story.key}</div>
                        </Link>
                        <Select
                          sunken
                          value={story.status}
                          onChange={(e) => handleStatusChange(story.id, e.target.value as StoryStatus)}
                          options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
                          className="text-xs"
                          aria-label={t('story.changeStatus')}
                        />
                        <PriorityBadge priority={story.priority} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
