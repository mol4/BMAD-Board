import { useEffect, useRef, useCallback, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { writeStoryStatus } from '@/lib/file-writer';
import KanbanColumn from '@/components/KanbanColumn';
import KanbanCard from '@/components/KanbanCard';
import Select from '@/components/Select';
import { AlertCircle } from 'lucide-react';
import type { StoryStatus } from '@/lib/types';

const COLUMNS: StoryStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];

export default function BoardPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const initialized = useAppStore((s) => s.initialized);
  const getStoriesByStatus = useAppStore((s) => s.getStoriesByStatus);
  const updateStoryStatus = useAppStore((s) => s.updateStoryStatus);
  useAppStore((s) => s.stories);
  const mountedRef = useRef(true);
  const inFlightRef = useRef<Set<string>>(new Set());
  const [failedStories, setFailedStories] = useState<Set<string>>(new Set());
  const retryTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      retryTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleStatusChange = useCallback(async (storyId: string, newStatus: StoryStatus) => {
    if (inFlightRef.current.has(storyId)) return;
    inFlightRef.current.add(storyId);

    let previousStatus!: StoryStatus;
    try {
      const story = useAppStore.getState().getStory(storyId);
      if (!story) return;

      if (story.status === newStatus) return;

      previousStatus = story.status;
      updateStoryStatus(storyId, newStatus);

      const result = await writeStoryStatus(story, newStatus);
      if (!result.ok && mountedRef.current) {
        if (result.code === 'FILE_LOCKED') {
          showToast(t('toast.fileLockedByAgent'), 'error');
        } else if (result.code === 'FILE_CHANGED') {
          showToast(t('toast.fileChanged'), 'error');
        } else {
          showToast(t('toast.kanbanRetry'), 'error');
        }
        updateStoryStatus(storyId, previousStatus);

        setFailedStories((prev) => new Set(prev).add(storyId));
        const timer = setTimeout(() => {
          if (mountedRef.current) {
            setFailedStories((prev) => {
              const next = new Set(prev);
              next.delete(storyId);
              return next;
            });
          }
          retryTimersRef.current.delete(storyId);
        }, 30000);
        retryTimersRef.current.set(storyId, timer);
        return;
      }

      if (mountedRef.current && result.ok) {
        showToast(t('toast.statusUpdated'), 'success');
        setFailedStories((prev) => {
          const next = new Set(prev);
          next.delete(storyId);
          return next;
        });
      }
    } catch {
      if (mountedRef.current && previousStatus !== undefined) {
        updateStoryStatus(storyId, previousStatus);
        showToast(t('toast.kanbanRetry'), 'error');
        setFailedStories((prev) => new Set(prev).add(storyId));
        const timer = setTimeout(() => {
          if (mountedRef.current) {
            setFailedStories((prev) => {
              const next = new Set(prev);
              next.delete(storyId);
              return next;
            });
          }
          retryTimersRef.current.delete(storyId);
        }, 30000);
        retryTimersRef.current.set(storyId, timer);
      }
    } finally {
      inFlightRef.current.delete(storyId);
    }
  }, [updateStoryStatus, showToast, t]);

  const handleDrop = useCallback((storyId: string, newStatus: StoryStatus) => {
    handleStatusChange(storyId, newStatus);
  }, [handleStatusChange]);

  const handleSelectChange = useCallback((storyId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (COLUMNS.includes(value as StoryStatus)) {
      handleStatusChange(storyId, value as StoryStatus);
    }
  }, [handleStatusChange]);

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

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => {
          const columnStories = getStoriesByStatus(status);
          return (
            <KanbanColumn
              key={status}
              status={status}
              count={columnStories.length}
              onDrop={handleDrop}
            >
              {columnStories.map((story) => (
                <div key={story.id} className="relative">
                  <KanbanCard story={story} />
                  <Select
                    value={story.status}
                    onChange={(e) => handleSelectChange(story.id, e)}
                    options={COLUMNS.map((s) => ({ value: s, label: t(`status.${s}`) }))}
                    className="mt-1 text-xs"
                    aria-label={t('story.changeStatus')}
                  />
                  {failedStories.has(story.id) && (
                    <div className="absolute top-1 right-1 flex items-center gap-1 text-destructive animate-pulse">
                      <AlertCircle size={16} />
                    </div>
                  )}
                </div>
              ))}
              {columnStories.length === 0 && (
                <p className="text-xs text-foreground-tertiary text-center py-4">
                  {t('common.noDescription')}
                </p>
              )}
            </KanbanColumn>
          );
        })}
      </div>
    </div>
  );
}
