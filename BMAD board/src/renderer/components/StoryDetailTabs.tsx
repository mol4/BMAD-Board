import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import EditWarningDialog from '@/components/EditWarningDialog';
import { renderMarkdown, renderMarkdownInline } from '@/lib/markdown-render';
import type { Story } from '@/lib/types';

type Tab = 'info' | 'markdown';

const EDIT_WARNING_KEY = 'bmad-board-hide-edit-warning';

interface StoryDetailTabsProps {
  story: Story;
  rawMarkdown: string | null;
  onOpenMdModal: () => void;
}

export default function StoryDetailTabs({ story, rawMarkdown, onOpenMdModal }: StoryDetailTabsProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [markdownView, setMarkdownView] = useState<'rendered' | 'raw'>('rendered');
  const [editWarningOpen, setEditWarningOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(
    () => localStorage.getItem(EDIT_WARNING_KEY) === 'true',
  );
  const getEpic = useAppStore((s) => s.getEpic);
  const getTask = useAppStore((s) => s.getTask);
  const epic = getEpic(story.epicId);

  const handleEditClick = () => {
    if (dontShowAgain) {
      onOpenMdModal();
    } else {
      setEditWarningOpen(true);
    }
  };

  const handleEditConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem(EDIT_WARNING_KEY, 'true');
    }
    setEditWarningOpen(false);
    onOpenMdModal();
  };

  const tabBase = 'px-4 py-2 text-[14px] border-b-2 transition-colors';

  return (
    <div>
      <div className="flex gap-6 border-b border-border-default">
        <button
          className={`${tabBase} ${
            activeTab === 'info'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground-tertiary hover:text-foreground-secondary'
          }`}
          onClick={() => setActiveTab('info')}
        >
          {t('story.tab.info')}
        </button>
        <button
          className={`${tabBase} ${
            activeTab === 'markdown'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground-tertiary hover:text-foreground-secondary'
          }`}
          onClick={() => setActiveTab('markdown')}
        >
          {t('story.tab.markdown')}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">
                  {t('story.description')}
                </h2>
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
                <section>
                  <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">
                    {t('story.acceptanceCriteria')}
                  </h2>
                  <ul className="space-y-1">
                    {story.acceptanceCriteria.map((ac, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                        <Check size={14} className="text-accent mt-1 shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: renderMarkdownInline(ac) }} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
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
                  <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">
                    {t('story.labels')}
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {story.labels.map((label) => (
                      <span key={label} className="px-2 py-1 bg-surface-sunken rounded text-xs text-foreground-secondary">
                        {label}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="bg-surface-sunken rounded-lg p-4 space-y-4 h-fit">
              {epic && (
                <div>
                  <div className="text-caption text-foreground-tertiary mb-1">{t('story.epic')}</div>
                  <div className="text-sm text-foreground-primary">{epic.title}</div>
                </div>
              )}
              {story.assignee && (
                <div>
                  <div className="text-caption text-foreground-tertiary mb-1">{t('story.assignee')}</div>
                  <div className="text-sm text-foreground-primary">{story.assignee}</div>
                </div>
              )}
              {story.storyPoints !== undefined && (
                <div>
                  <div className="text-caption text-foreground-tertiary mb-1">{t('story.storyPoints')}</div>
                  <div className="text-sm text-foreground-primary">{story.storyPoints}</div>
                </div>
              )}
              <div>
                <div className="text-caption text-foreground-tertiary mb-1">{t('story.status')}</div>
                <StatusBadge status={story.status} />
              </div>
              {story.sourceFile && (
                <div>
                  <div className="text-caption text-foreground-tertiary mb-1">{t('story.mdFile')}</div>
                  <div className="text-sm text-foreground-primary truncate">{story.sourceFile}</div>
                </div>
              )}
            </aside>
          </div>
        )}

        {activeTab === 'markdown' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                className={`px-3 py-1 text-sm rounded ${
                  markdownView === 'rendered'
                    ? 'bg-accent text-foreground-on-accent'
                    : 'bg-surface-sunken text-foreground-secondary'
                }`}
                onClick={() => setMarkdownView('rendered')}
              >
                {t('story.rendered')}
              </button>
              <button
                className={`px-3 py-1 text-sm rounded ${
                  markdownView === 'raw'
                    ? 'bg-accent text-foreground-on-accent'
                    : 'bg-surface-sunken text-foreground-secondary'
                }`}
                onClick={() => setMarkdownView('raw')}
              >
                {t('story.raw')}
              </button>
              {story.sourceFile && (
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded bg-status-done-bg text-status-done-fg hover:bg-status-done-bg/80 transition-colors cursor-pointer"
                  title={t('editor.edit')}
                >
                  <Pencil size={14} />
                  {t('editor.edit')}
                </button>
              )}
            </div>

            {rawMarkdown ? (
              markdownView === 'rendered' ? (
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
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(rawMarkdown) }}
                />
              ) : (
                <pre className="font-mono text-sm bg-surface-sunken rounded-lg p-4 overflow-auto whitespace-pre-wrap text-foreground-secondary">
                  {rawMarkdown}
                </pre>
              )
            ) : (
              <p className="text-foreground-tertiary">{t('story.noMarkdown')}</p>
            )}
          </div>
        )}
      </div>

      <EditWarningDialog
        isOpen={editWarningOpen}
        onConfirm={handleEditConfirm}
        onCancel={() => setEditWarningOpen(false)}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
      />
    </div>
  );
}
