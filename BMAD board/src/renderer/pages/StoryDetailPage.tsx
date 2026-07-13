import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { PriorityBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { writeStoryStatus, writeMarkdownFile } from '@/lib/file-writer';
import { FileText } from 'lucide-react';
import MarkdownModal from '@/components/MarkdownModal';
import Select from '@/components/Select';
import { renderMarkdown, renderMarkdownInline } from '@/lib/markdown-render';
import type { Story, StoryStatus } from '@/lib/types';

const STATUSES: StoryStatus[] = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { showToast } = useToast();
  const initialized = useAppStore((s) => s.initialized);
  const [story, setStory] = useState<Story | null>(null);
  const [notFound, setNotFound] = useState(false);
  const getStory = useAppStore((s) => s.getStory);
  const getStoryByKey = useAppStore((s) => s.getStoryByKey);
  const getEpic = useAppStore((s) => s.getEpic);
  const getTask = useAppStore((s) => s.getTask);
  const updateStoryStatus = useAppStore((s) => s.updateStoryStatus);
  const [mdModalOpen, setMdModalOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const openMdModal = async (s: Story) => {
    let content = s.rawMarkdown ?? null;
    if (!content && s.sourceFile) {
      const result = await window.electronAPI?.fileRead(s.sourceFile);
      content = result?.content ?? null;
    }
    setMdContent(content);
    setMdModalOpen(true);
  };

  const handleStatusChange = useCallback(async (newStatus: StoryStatus) => {
    if (!story) return;
    const previousStatus = story.status;

    updateStoryStatus(story.id, newStatus);

    const updatedStory = useAppStore.getState().getStory(story.id);
    if (!updatedStory) {
      updateStoryStatus(story.id, previousStatus);
      return;
    }
    setStory(updatedStory);

    const result = await writeStoryStatus(updatedStory, newStatus);
    if (!result.ok && mountedRef.current) {
      if (result.code === 'FILE_LOCKED') {
        showToast(t('toast.fileLockedByAgent'), 'error');
      } else if (result.code === 'FILE_CHANGED') {
        showToast(t('toast.fileChanged'), 'error');
      } else {
        showToast(t('toast.statusUpdateFailed'), 'error');
      }
      updateStoryStatus(story.id, previousStatus);
      setStory(useAppStore.getState().getStory(story.id) ?? updatedStory);
      return;
    }

    if (mountedRef.current && result.ok) {
      showToast(t('toast.statusUpdated'), 'success');
      setStory(useAppStore.getState().getStory(story.id) ?? updatedStory);
    }
  }, [story, updateStoryStatus, showToast, t]);

  const handleSaveMarkdown = useCallback(async (content: string) => {
    if (!story?.sourceFile) return;
    const result = await writeMarkdownFile(story.sourceFile, content);
    if (!result.ok && mountedRef.current) {
      if (result.code === 'FILE_LOCKED') {
        showToast(t('toast.fileLockedByAgent'), 'error');
      } else if (result.code === 'FILE_CHANGED') {
        showToast(t('toast.fileChanged'), 'error');
      } else {
        showToast(t('toast.editSaveFailed'), 'error');
      }
      return;
    }
    if (mountedRef.current && result.ok) {
      setMdContent(content);
    }
  }, [story, showToast, t]);

  useEffect(() => {
    if (!initialized) return;
    const found = getStoryByKey(id || '') || getStory(id || '');
    if (found) {
      setStory(found);
    } else {
      setNotFound(true);
    }
  }, [id, initialized, getStory, getStoryByKey]);

  if (!initialized) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-tertiary">{t('common.loading')}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground-secondary">{t('story.notFound')}</h2>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-tertiary">{t('common.loading')}</p>
      </div>
    );
  }

  const epic = getEpic(story.epicId);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{story.title}</h1>
          <Select
            sunken
            value={story.status}
            onChange={(e) => handleStatusChange(e.target.value as StoryStatus)}
            options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
            className="text-xs"
            aria-label={t('story.changeStatus')}
          />
          <PriorityBadge priority={story.priority} />
        </div>
        <div className="flex items-center gap-4 text-sm text-foreground-secondary">
          <span>{story.key}</span>
          {epic && <span>{t('story.epic')}: {epic.title}</span>}
          {story.assignee && <span>{t('story.assignee')}: {story.assignee}</span>}
          {story.storyPoints !== undefined && <span>{story.storyPoints} SP</span>}
          {story.sourceFile && (
            <button
              onClick={() => openMdModal(story)}
              className="inline-flex items-center gap-1 text-foreground-tertiary hover:text-foreground-primary transition-colors cursor-pointer"
              title={story.sourceFile}
            >
              <FileText size={14} />
              {t('story.hasFile')}
            </button>
          )}
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">{t('story.info')}</h2>
        <div
          className="prose prose-sm max-w-none prose-invert
            prose-headings:text-foreground-primary prose-headings:font-semibold
            prose-p:text-foreground-secondary
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-code:text-foreground-primary prose-code:bg-surface-sunken prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
            prose-pre:bg-surface-sunken prose-pre:border prose-pre:border-border-subtle
            prose-blockquote:border-l-accent prose-blockquote:text-foreground-tertiary
            prose-strong:text-foreground-primary
            prose-li:text-foreground-secondary
            prose-hr:border-border-subtle"
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(story.description || t('common.noDescription')),
          }}
        />
      </section>

      {story.acceptanceCriteria.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">{t('story.acceptanceCriteria')}</h2>
          <ul className="space-y-1">
            {story.acceptanceCriteria.map((ac, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-foreground-secondary"
              >
                <span className="text-accent mt-1">&#10003;</span>
                <span dangerouslySetInnerHTML={{ __html: renderMarkdownInline(ac) }} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">
          {t('story.tasks')} ({story.tasks.length})
        </h2>
        {story.tasks.length === 0 ? (
          <p className="text-sm text-foreground-tertiary">{t('story.noTasks')}</p>
        ) : (
          <div className="space-y-2">
            {story.tasks.map((taskId) => {
              const task = getTask(taskId);
              if (!task) return null;
              return (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-surface-elevated rounded">
                  <span className="text-xs bg-surface-sunken border border-border-default rounded px-2 py-0.5 text-foreground-primary">
                    {task.status}
                  </span>
                  <span className="text-sm">{task.title}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {story.labels.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">{t('story.labels')}</h2>
          <div className="flex gap-2 flex-wrap">
            {story.labels.map((label) => (
              <span key={label} className="px-2 py-1 bg-surface-sunken rounded text-xs text-foreground-secondary">
                {label}
              </span>
            ))}
          </div>
        </section>
      )}

      <MarkdownModal
        isOpen={mdModalOpen}
        onClose={() => setMdModalOpen(false)}
        title={story.title}
        markdownContent={mdContent}
        filePath={story.sourceFile}
        editable={!!story.sourceFile}
        onSave={handleSaveMarkdown}
      />
    </div>
  );
}
