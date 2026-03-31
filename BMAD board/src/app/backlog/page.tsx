'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import CreateModal from '@/components/CreateModal';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface EpicWithStories {
  id: string;
  key: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  stories: string[];
  labels: string[];
  storyCount: number;
  doneCount: number;
}

interface StoryItem {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  storyPoints?: number;
  assignee?: string;
  epicId: string;
}

export default function BacklogPage() {
  const [epics, setEpics] = useState<EpicWithStories[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedEpicId, setSelectedEpicId] = useState<string>('');
  const { t } = useI18n();

  const fetchData = useCallback(async () => {
    const [epicsRes, storiesRes] = await Promise.all([
      fetch('/api/epics'),
      fetch('/api/stories'),
    ]);
    const epicsData = await epicsRes.json();
    const storiesData = await storiesRes.json();
    setEpics(epicsData);
    setStories(storiesData);
    setExpandedEpics(new Set(epicsData.map((e: EpicWithStories) => e.id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  };

  const handleCreateStory = async (data: Record<string, string>) => {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        epicId: data.epicId || selectedEpicId,
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
        storyPoints: data.storyPoints ? parseInt(data.storyPoints) : undefined,
        assignee: data.assignee || undefined,
      }),
    });
    fetchData();
  };

  const handleStatusChange = async (storyId: string, newStatus: string) => {
    await fetch('/api/stories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: storyId, status: newStatus }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-jira-gray-900">{t('backlog.title')}</h1>
          <p className="text-sm text-jira-gray-600 mt-1">
            {t('backlog.storiesInEpics', { stories: stories.length, epics: epics.length })}
          </p>
        </div>
        <button
          onClick={() => setShowCreateStory(true)}
          className="px-4 py-2 bg-jira-blue text-white text-sm font-medium rounded-md hover:bg-jira-blue-dark transition-colors"
        >
          {t('backlog.createStory')}
        </button>
      </div>

      {epics.length === 0 ? (
        <div className="bg-white rounded-lg border border-jira-gray-200 p-12 text-center text-jira-gray-500">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg font-medium mb-2">{t('backlog.empty')}</p>
          <p className="text-sm">
            {t('backlog.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {epics.map((epic) => {
            const epicStories = stories.filter((s) => s.epicId === epic.id);
            const isExpanded = expandedEpics.has(epic.id);

            return (
              <div
                key={epic.id}
                className="bg-white rounded-lg border border-jira-gray-200 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-jira-gray-200 cursor-pointer hover:bg-purple-100 transition-colors"
                  onClick={() => toggleEpic(epic.id)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-jira-gray-500 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="text-xs font-mono text-purple-600">{epic.key}</span>
                    <span className="font-medium text-jira-gray-900">{epic.title}</span>
                    <StatusBadge status={epic.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-jira-gray-500">
                      {epic.doneCount}/{epic.storyCount} {t('backlog.storiesCount')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEpicId(epic.id);
                        setShowCreateStory(true);
                      }}
                      className="text-xs px-2 py-1 text-jira-blue hover:bg-jira-blue-light rounded transition-colors"
                    >
                      {t('backlog.addStory')}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-jira-gray-100">
                    {epicStories.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-jira-gray-400">
                        {t('backlog.noStories')}
                      </div>
                    ) : (
                      epicStories.map((story) => (
                        <div
                          key={story.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-jira-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-jira-gray-500 w-20">
                              {story.key}
                            </span>
                            <Link
                              href={`/stories/${story.id}`}
                              className="text-sm font-medium text-jira-gray-900 hover:text-jira-blue"
                            >
                              {story.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-3">
                            <PriorityBadge priority={story.priority as any} />
                            {story.storyPoints && (
                              <span className="bg-jira-gray-200 text-jira-gray-700 text-xs font-bold px-1.5 py-0.5 rounded">
                                {story.storyPoints} SP
                              </span>
                            )}
                            <select
                              value={story.status}
                              onChange={(e) => handleStatusChange(story.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-jira-gray-300 rounded-md bg-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="backlog">{t('status.backlog')}</option>
                              <option value="todo">{t('status.todo')}</option>
                              <option value="in-progress">{t('status.in-progress')}</option>
                              <option value="in-review">{t('status.in-review')}</option>
                              <option value="done">{t('status.done')}</option>
                            </select>
                            {story.assignee && (
                              <div className="w-6 h-6 rounded-full bg-jira-blue text-white text-xs flex items-center justify-center font-bold">
                                {story.assignee[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateModal
        isOpen={showCreateStory}
        onClose={() => {
          setShowCreateStory(false);
          setSelectedEpicId('');
        }}
        title={t('story.createModal')}
        onSubmit={handleCreateStory}
        fields={[
          ...(selectedEpicId
            ? []
            : [
                {
                  name: 'epicId',
                  label: t('story.epic'),
                  type: 'select' as const,
                  required: true,
                  options: epics.map((e) => ({ value: e.id, label: `${e.key}: ${e.title}` })),
                },
              ]),
          { name: 'title', label: t('story.name'), type: 'text' as const, required: true, placeholder: t('story.namePlaceholder') },
          { name: 'description', label: t('story.description'), type: 'textarea' as const, placeholder: t('story.descriptionPlaceholder') },
          {
            name: 'priority',
            label: t('story.priority'),
            type: 'select' as const,
            options: [
              { value: 'critical', label: t('priority.critical.icon') },
              { value: 'high', label: t('priority.high.icon') },
              { value: 'medium', label: t('priority.medium.icon') },
              { value: 'low', label: t('priority.low.icon') },
            ],
          },
          { name: 'storyPoints', label: t('story.storyPoints'), type: 'number' as const, placeholder: '0' },
          { name: 'assignee', label: t('story.assignee'), type: 'text' as const, placeholder: t('story.assigneePlaceholder') },
        ]}
      />
    </div>
  );
}