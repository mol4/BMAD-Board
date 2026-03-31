'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge, PriorityBadge, IssueTypeBadge } from '@/components/StatusBadge';
import CreateModal from '@/components/CreateModal';
import { useI18n } from '@/lib/i18n';

interface TaskData {
  id: string;
  key: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
}

interface EpicData {
  id: string;
  key: string;
  title: string;
}

interface StoryDetail {
  id: string;
  key: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: string;
  priority: string;
  storyPoints?: number;
  assignee?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  tasksData: TaskData[];
  epicData: EpicData;
  rawMarkdown?: string;
  sourceFile?: string;
}

export default function StoryDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'md'>(
    searchParams.get('tab') === 'md' ? 'md' : 'info'
  );
  const [renderedMd, setRenderedMd] = useState<string>('');
  const [mdLoading, setMdLoading] = useState(false);
  const [mdFileName, setMdFileName] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [rawMd, setRawMd] = useState<string>('');
  const [editingMd, setEditingMd] = useState(false);
  const [editMdValue, setEditMdValue] = useState('');
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t, locale } = useI18n();

  const fetchStory = async () => {
    const res = await fetch(`/api/stories?id=${params.id}`);
    const data = await res.json();
    setStory(data);
    setLoading(false);

    const isFile = data.sourceFile && !data.sourceFile?.endsWith('epics.md');
    setHasFile(!!isFile);

    if (searchParams.get('tab') === 'md') {
      loadMarkdown(data.id);
    }
  };

  const loadMarkdown = async (storyId: string) => {
    setMdLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/markdown`);
      const data = await res.json();
      if (data.markdown) {
        setRawMd(data.markdown);
        const { marked } = await import('marked');
        marked.setOptions({ breaks: true, gfm: true });
        const html = await marked.parse(data.markdown);
        setRenderedMd(html);
        setMdFileName(data.fileName);
      }
    } catch {
      setRenderedMd('<p class="text-red-500">' + t('story.loadError') + '</p>');
    }
    setMdLoading(false);
  };

  useEffect(() => {
    fetchStory();
  }, [params.id]);

  const handleTabChange = (tab: 'info' | 'md') => {
    setActiveTab(tab);
    if (tab === 'md' && story && !renderedMd) {
      loadMarkdown(story.id);
    }
  };

  const handleEditClick = () => {
    setShowEditWarning(true);
  };

  const handleConfirmEdit = () => {
    setShowEditWarning(false);
    setEditMdValue(rawMd);
    setEditingMd(true);
  };

  const handleCancelEdit = () => {
    setEditingMd(false);
    setEditMdValue('');
  };

  const handleSaveMd = async () => {
    if (!story) return;
    setSaving(true);
    try {
      await fetch(`/api/stories/${story.id}/markdown`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: editMdValue }),
      });
      setRawMd(editMdValue);
      const { marked } = await import('marked');
      marked.setOptions({ breaks: true, gfm: true });
      const html = await marked.parse(editMdValue);
      setRenderedMd(html);
      setEditingMd(false);
      setEditMdValue('');
    } catch {
      alert(t('story.saveError'));
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    await fetch('/api/stories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: story?.id, status: newStatus }),
    });
    fetchStory();
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    });
    fetchStory();
  };

  const handleCreateTask = async (data: Record<string, string>) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: story?.id,
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
      }),
    });
    fetchStory();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="p-8 text-center text-jira-gray-500">
        <p className="text-4xl mb-4">😿</p>
        <p>{t('story.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-jira-gray-500 mb-6">
        <Link href="/epics" className="hover:text-jira-blue">
          {t('nav.epics')}
        </Link>
        <span>/</span>
        {story.epicData && (
          <>
            <Link href={`/epics/${story.epicData.id}`} className="hover:text-jira-blue">
              {story.epicData.key}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-jira-gray-900">{story.key}</span>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-jira-gray-200">
        <button
          onClick={() => handleTabChange('info')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-jira-blue text-jira-blue'
              : 'border-transparent text-jira-gray-500 hover:text-jira-gray-700'
          }`}
        >
          {t('story.info')}
        </button>
        <button
          onClick={() => handleTabChange('md')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'md'
              ? 'border-jira-blue text-jira-blue'
              : 'border-transparent text-jira-gray-500 hover:text-jira-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
            {hasFile ? t('story.mdFile') : 'Markdown'}
        </button>
      </div>

      {showEditWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-jira-gray-900">{t('story.editFile')}</h3>
            </div>
            <p className="text-sm text-jira-gray-600 mb-6">
              {hasFile ? t('story.editWarningFile') : t('story.editWarningInline')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditWarning(false)}
                className="px-4 py-2 text-sm text-jira-gray-600 hover:text-jira-gray-800 border border-jira-gray-300 rounded-md hover:bg-jira-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-2 text-sm text-white bg-jira-blue rounded-md hover:bg-jira-blue-dark transition-colors"
              >
                {t('common.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'md' && (
        <div className="bg-white rounded-lg border border-jira-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-jira-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-jira-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-mono text-jira-gray-600">
                {mdFileName || (hasFile ? t('common.loading') : t('story.inlineFromEpics'))}
              </span>
            </div>
            {!mdLoading && renderedMd && !editingMd && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-jira-gray-600 border border-jira-gray-300 rounded-md hover:bg-jira-gray-50 hover:text-jira-gray-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('common.edit')}
              </button>
            )}
          </div>
          {mdLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-jira-blue"></div>
            </div>
          ) : editingMd ? (
            <div>
              <textarea
                value={editMdValue}
                onChange={(e) => setEditMdValue(e.target.value)}
                className="w-full h-[500px] p-4 font-mono text-sm border border-jira-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent resize-y bg-jira-gray-50"
                spellCheck={false}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-jira-gray-600 border border-jira-gray-300 rounded-md hover:bg-jira-gray-50 transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveMd}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>}
                  {t('common.save')}
                </button>
              </div>
            </div>
          ) : (
            <article
              className="prose prose-sm max-w-none prose-headings:text-jira-gray-900 prose-p:text-jira-gray-700 prose-strong:text-jira-gray-800 prose-code:text-pink-600 prose-code:bg-jira-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-jira-gray-900 prose-pre:text-gray-100 prose-li:text-jira-gray-700 prose-a:text-jira-blue"
              dangerouslySetInnerHTML={{ __html: renderedMd }}
            />
          )}
        </div>
      )}

      {activeTab === 'info' && (
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-jira-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <IssueTypeBadge type="story" />
              <span className="text-sm font-mono text-jira-gray-500">{story.key}</span>
              {hasFile && (
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                  {t('story.hasFile')}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-jira-gray-900 mb-4">{story.title}</h1>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-jira-gray-700 mb-2">{t('story.description')}</h3>
              <div className="text-sm text-jira-gray-700 whitespace-pre-wrap">
                {story.description || t('common.noDescription')}
              </div>
            </div>

            {story.acceptanceCriteria?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-jira-gray-700 mb-2">
                  {t('story.acceptanceCriteria')}
                </h3>
                <ul className="space-y-2">
                  {story.acceptanceCriteria.map((ac, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-jira-gray-700"
                    >
                      <span className="mt-0.5 text-green-500">✓</span>
                      {ac}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-jira-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-jira-gray-200">
              <h2 className="font-semibold text-jira-gray-900">
                {t('story.tasks')} ({story.tasksData?.length || 0})
              </h2>
              <button
                onClick={() => setShowCreateTask(true)}
                className="px-3 py-1.5 bg-jira-blue text-white text-xs rounded-md hover:bg-jira-blue-dark transition-colors"
              >
                {t('story.addTask')}
              </button>
            </div>

            {!story.tasksData || story.tasksData.length === 0 ? (
              <div className="p-6 text-center text-sm text-jira-gray-400">
                {t('story.noTasks')}
              </div>
            ) : (
              <div className="divide-y divide-jira-gray-100">
                {story.tasksData.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={(e) =>
                          handleTaskStatusChange(
                            task.id,
                            e.target.checked ? 'done' : 'todo'
                          )
                        }
                        className="rounded border-jira-gray-300"
                      />
                      <span className="text-xs font-mono text-jira-gray-500">
                        {task.key}
                      </span>
                      <span
                        className={`text-sm ${
                          task.status === 'done'
                            ? 'line-through text-jira-gray-400'
                            : 'text-jira-gray-900'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority as any} />
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleTaskStatusChange(task.id, e.target.value)
                        }
                        className="text-xs px-2 py-1 border border-jira-gray-300 rounded-md bg-white"
                      >
                        <option value="todo">{t('status.todo')}</option>
                        <option value="in-progress">{t('status.in-progress')}</option>
                        <option value="done">{t('status.done')}</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-jira-gray-200 p-4">
            <h3 className="text-xs font-semibold text-jira-gray-500 uppercase mb-3">
              {t('story.status')}
            </h3>
            <select
              value={story.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-jira-gray-300 rounded-md text-sm"
            >
              <option value="backlog">{t('status.backlog')}</option>
              <option value="todo">{t('status.todo')}</option>
              <option value="in-progress">{t('status.in-progress')}</option>
              <option value="in-review">{t('status.in-review')}</option>
              <option value="done">{t('status.done')}</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-jira-gray-200 p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-jira-gray-500 uppercase mb-1">
                {t('story.priority')}
              </h3>
              <PriorityBadge priority={story.priority as any} />
            </div>

            {story.storyPoints && (
              <div>
                <h3 className="text-xs font-semibold text-jira-gray-500 uppercase mb-1">
                  Story Points
                </h3>
                <span className="text-sm font-bold text-jira-gray-900">
                  {story.storyPoints}
                </span>
              </div>
            )}

            {story.assignee && (
              <div>
                <h3 className="text-xs font-semibold text-jira-gray-500 uppercase mb-1">
                  {t('story.assignee')}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-jira-blue text-white text-xs flex items-center justify-center font-bold">
                    {story.assignee[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-jira-gray-900">{story.assignee}</span>
                </div>
              </div>
            )}

            {story.epicData && (
              <div>
                <h3 className="text-xs font-semibold text-jira-gray-500 uppercase mb-1">
                  {t('story.epic')}
                </h3>
                <Link
                  href={`/epics/${story.epicData.id}`}
                  className="text-sm text-jira-blue hover:underline"
                >
                  {story.epicData.key}: {story.epicData.title}
                </Link>
              </div>
            )}

            {story.labels?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-jira-gray-500 uppercase mb-1">
                  {t('story.labels')}
                </h3>
                <div className="flex gap-1 flex-wrap">
                  {story.labels.map((label) => (
                    <span
                      key={label}
                      className="bg-jira-gray-100 text-jira-gray-600 text-xs px-2 py-0.5 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-jira-gray-400 pt-2 border-t border-jira-gray-200 space-y-1">
              <p>{t('epic.created')}: {new Date(story.createdAt).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</p>
              <p>{t('epic.updated')}: {new Date(story.updatedAt).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      <CreateModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title={t('task.createModal')}
        onSubmit={handleCreateTask}
        fields={[
          { name: 'title', label: t('task.name'), type: 'text', required: true, placeholder: t('task.namePlaceholder') },
          { name: 'description', label: t('task.description'), type: 'textarea', placeholder: t('task.descriptionPlaceholder') },
          {
            name: 'priority',
            label: t('story.priority'),
            type: 'select',
            options: [
              { value: 'critical', label: t('priority.critical.icon') },
              { value: 'high', label: t('priority.high.icon') },
              { value: 'medium', label: t('priority.medium.icon') },
              { value: 'low', label: t('priority.low.icon') },
            ],
          },
        ]}
      />
    </div>
  );
}