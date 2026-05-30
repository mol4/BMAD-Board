import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import CreateModal from '@/components/CreateModal';

export default function BacklogPage() {
  const { t } = useI18n();
  const initialized = useAppStore((s) => s.initialized);
  const epics = useAppStore((s) => s.epics);
  const stories = useAppStore((s) => s.stories);
  const createStory = useAppStore((s) => s.createStory);
  const getStoriesByEpic = useAppStore((s) => s.getStoriesByEpic);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<string>('');

  if (!initialized) {
    return (
      <div className="text-center py-12 text-foreground-tertiary">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  const handleCreateStory = (data: Record<string, string>) => {
    const epic = epics.find((e) => e.id === selectedEpic) || epics[0];
    if (!epic) return;
    createStory({
      epicId: epic.id,
      title: data.title,
      description: data.description || '',
      priority: data.priority as 'critical' | 'high' | 'medium' | 'low' || 'medium',
      storyPoints: data.storyPoints ? parseInt(data.storyPoints, 10) : undefined,
      assignee: data.assignee || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('backlog.title')}</h1>
          <p className="text-sm text-foreground-secondary">
            {t('backlog.storiesInEpics', { stories: stories.length, epics: epics.length })}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-accent text-foreground-on-accent text-sm rounded-md hover:bg-accent-hover transition-colors"
        >
          {t('backlog.createStory')}
        </button>
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
                      <div key={story.id} className="flex items-center gap-3 p-3 bg-surface-elevated rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{story.title}</div>
                          <div className="text-xs text-foreground-tertiary mt-0.5">{story.key}</div>
                        </div>
                        <StatusBadge status={story.status} />
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

      <CreateModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('story.createModal')}
        onSubmit={handleCreateStory}
        fields={[
          { name: 'title', label: t('story.name'), type: 'text', required: true, placeholder: t('story.namePlaceholder') },
          { name: 'description', label: t('story.description'), type: 'textarea', placeholder: t('story.descriptionPlaceholder') },
          {
            name: 'priority', label: t('story.priority'), type: 'select',
            options: [
              { value: 'critical', label: t('priority.critical') },
              { value: 'high', label: t('priority.high') },
              { value: 'medium', label: t('priority.medium') },
              { value: 'low', label: t('priority.low') },
            ],
          },
          { name: 'storyPoints', label: t('story.storyPoints'), type: 'number' },
          { name: 'assignee', label: t('story.assignee'), type: 'text', placeholder: t('story.assigneePlaceholder') },
        ]}
      />
    </div>
  );
}
