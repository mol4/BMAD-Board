import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { FileText } from 'lucide-react';
import MarkdownModal from '@/components/MarkdownModal';
import type { Story } from '@/lib/types';

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const initialized = useAppStore((s) => s.initialized);
  const [story, setStory] = useState<Story | null>(null);
  const [notFound, setNotFound] = useState(false);
  const getStory = useAppStore((s) => s.getStory);
  const getStoryByKey = useAppStore((s) => s.getStoryByKey);
  const getEpic = useAppStore((s) => s.getEpic);
  const getTask = useAppStore((s) => s.getTask);
  const [mdModalOpen, setMdModalOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string | null>(null);

  const openMdModal = async (s: Story) => {
    let content = s.rawMarkdown ?? null;
    if (!content && s.sourceFile) {
      const result = await window.electronAPI?.fileRead(s.sourceFile);
      content = result?.content ?? null;
    }
    setMdContent(content);
    setMdModalOpen(true);
  };

  useEffect(() => {
    if (!initialized) return;
    const found = getStoryByKey(id || '') || getStory(id || '');
    if (found) {
      setStory(found);
    } else {
      setNotFound(true);
    }
  }, [id, initialized]);

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
          <StatusBadge status={story.status} />
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
        <p className="text-sm text-foreground-secondary">
          {story.description || t('common.noDescription')}
        </p>
      </section>

      {story.acceptanceCriteria.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">{t('story.acceptanceCriteria')}</h2>
          <ul className="space-y-1">
            {story.acceptanceCriteria.map((ac, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                <span className="text-accent mt-1">&#10003;</span>
                {ac}
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
                  <StatusBadge status={task.status} />
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
      />
    </div>
  );
}
