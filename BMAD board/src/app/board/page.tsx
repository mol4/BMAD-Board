'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PriorityBadge } from '@/components/StatusBadge';
import { useI18n } from '@/lib/i18n';

interface StoryBoard {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  storyPoints?: number;
  assignee?: string;
  labels: string[];
  epicId: string;
  sourceFile?: string;
}

interface EpicInfo {
  id: string;
  key: string;
  title: string;
  status: string;
}

interface SprintMeta {
  project: string;
  generated: string;
  lastUpdated: string;
}

type StoryStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';

export default function BoardPage() {
  const [stories, setStories] = useState<StoryBoard[]>([]);
  const [epics, setEpics] = useState<EpicInfo[]>([]);
  const [sprintMeta, setSprintMeta] = useState<SprintMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedStory, setDraggedStory] = useState<string | null>(null);
  const [filterEpic, setFilterEpic] = useState<string>('all');
  const { t } = useI18n();

  const columns: { id: StoryStatus; title: string; color: string }[] = [
    { id: 'backlog', title: t('status.backlog'), color: 'border-t-gray-400' },
    { id: 'todo', title: t('status.todo'), color: 'border-t-blue-400' },
    { id: 'in-progress', title: t('status.in-progress'), color: 'border-t-yellow-400' },
    { id: 'in-review', title: t('status.in-review'), color: 'border-t-purple-400' },
    { id: 'done', title: t('status.done'), color: 'border-t-green-400' },
  ];

  const fetchData = useCallback(async () => {
    const [storiesRes, epicsRes, diagRes] = await Promise.all([
      fetch('/api/stories'),
      fetch('/api/epics'),
      fetch('/api/diagnostics'),
    ]);
    const storiesData = await storiesRes.json();
    const epicsData = await epicsRes.json();
    const diagData = await diagRes.json();
    setStories(storiesData);
    setEpics(epicsData);
    if (diagData.sprintMeta) {
      setSprintMeta(diagData.sprintMeta);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (epics.length > 0 && filterEpic === 'all') {
      const active = epics.find((e) => e.status === 'in-progress');
      if (active) {
        setFilterEpic(active.id);
      }
    }
  }, [epics]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragStart = (storyId: string) => {
    setDraggedStory(storyId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-jira-gray-200');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-jira-gray-200');
  };

  const handleDrop = async (e: React.DragEvent, newStatus: StoryStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-jira-gray-200');

    if (!draggedStory) return;

    setStories((prev) =>
      prev.map((s) => (s.id === draggedStory ? { ...s, status: newStatus } : s))
    );

    await fetch('/api/stories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draggedStory, status: newStatus }),
    });

    setDraggedStory(null);
  };

  const getEpicInfo = (epicId: string) => epics.find((e) => e.id === epicId);
  const hasFile = (s: StoryBoard) => s.sourceFile && !s.sourceFile.endsWith('epics.md');

  const filteredStories =
    filterEpic === 'all' ? stories : stories.filter((s) => s.epicId === filterEpic);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-jira-gray-900">{t('board.title')}</h1>
            {sprintMeta && (
              <p className="text-sm text-jira-gray-500 mt-1">
                {sprintMeta.project} · {t('board.updated')} {sprintMeta.lastUpdated}
              </p>
            )}
          </div>
          <select
            value={filterEpic}
            onChange={(e) => setFilterEpic(e.target.value)}
            className="text-sm border border-jira-gray-300 rounded-lg px-3 py-2 bg-white text-jira-gray-700"
          >
            <option value="all">{t('board.allEpics')}</option>
            {epics.map((e) => (
              <option key={e.id} value={e.id}>
                {e.key}: {e.title.length > 30 ? e.title.slice(0, 30) + '…' : e.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 mt-3">
          {columns.map((col) => {
            const count = filteredStories.filter((s) => s.status === col.id).length;
            return (
              <div key={col.id} className="text-xs text-jira-gray-500">
                {col.title}: <span className="font-semibold text-jira-gray-700">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnStories = filteredStories
            .filter((s) => s.status === column.id)
            .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
          return (
            <div
              key={column.id}
              className={`flex-1 min-w-[250px] bg-jira-gray-100 rounded-lg border-t-4 ${column.color} transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="px-3 py-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-jira-gray-600 uppercase tracking-wider">
                  {column.title}
                </h3>
                <span className="bg-jira-gray-300 text-jira-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {columnStories.length}
                </span>
              </div>

              <div className="px-2 pb-2 space-y-2 min-h-[100px]">
                {columnStories.map((story) => {
                  const epic = getEpicInfo(story.epicId);
                  const storyHasFile = hasFile(story);

                  return (
                    <div
                      key={story.id}
                      draggable
                      onDragStart={() => handleDragStart(story.id)}
                      className={`bg-white rounded-lg border border-jira-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
                        draggedStory === story.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      {epic && (
                        <div className="text-[10px] text-jira-gray-400 font-medium mb-1 truncate">
                          {epic.key}
                        </div>
                      )}

                      <Link
                        href={`/stories/${story.id}`}
                        className="text-sm font-medium text-jira-gray-900 hover:text-jira-blue transition-colors line-clamp-2 block mb-2"
                      >
                        {story.title}
                      </Link>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-jira-gray-400">
                            {story.key}
                          </span>
                          <PriorityBadge priority={story.priority as any} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {storyHasFile && (
                            <Link
                              href={`/stories/${story.id}?tab=md`}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title={t('board.openMdFile')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </Link>
                          )}
                          {story.storyPoints && (
                            <span className="bg-jira-gray-200 text-jira-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {story.storyPoints}
                            </span>
                          )}
                          {story.assignee && (
                            <div className="w-5 h-5 rounded-full bg-jira-blue text-white text-[10px] flex items-center justify-center font-bold">
                              {story.assignee[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}