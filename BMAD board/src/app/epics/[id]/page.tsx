'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge, PriorityBadge, IssueTypeBadge } from '@/components/StatusBadge';
import CreateModal from '@/components/CreateModal';
import { useI18n } from '@/lib/i18n';

interface StoryData {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  storyPoints?: number;
  assignee?: string;
  sourceFile?: string;
}

interface EpicDetail {
  id: string;
  key: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  storiesData: StoryData[];
  rawMarkdown?: string;
  sourceFile?: string;
}

export default function EpicDetailPage() {
  const params = useParams();
  const [epic, setEpic] = useState<EpicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'md'>('info');
  const [renderedMd, setRenderedMd] = useState<string>('');
  const [mdLoading, setMdLoading] = useState(false);
  const [editingMd, setEditingMd] = useState(false);
  const [editMdValue, setEditMdValue] = useState('');
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t, locale } = useI18n();

  useEffect(() => {
    fetch(`/api/epics?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setEpic(data);
        setLoading(false);
      });
  }, [params.id]);

  const handleTabChange = (tab: 'info' | 'md') => {
    setActiveTab(tab);
    if (tab === 'md' && epic?.rawMarkdown && !renderedMd) {
      renderMarkdown(epic.rawMarkdown);
    }
  };

  const renderMarkdown = async (md: string) => {
    setMdLoading(true);
    try {
      const { marked } = await import('marked');
      marked.setOptions({ breaks: true, gfm: true });
      const html = await marked.parse(md);
      setRenderedMd(html);
    } catch {
      setRenderedMd('<p class="text-red-500">' + t('epic.renderError') + '</p>');
    }
    setMdLoading(false);
  };

  const handleEditClick = () => {
    setShowEditWarning(true);
  };

  const handleConfirmEdit = () => {
    setShowEditWarning(false);
    setEditMdValue(epic?.rawMarkdown || '');
    setEditingMd(true);
  };

  const handleCancelEdit = () => {
    setEditingMd(false);
    setEditMdValue('');
  };

  const handleSaveMd = async () => {
    if (!epic) return;
    setSaving(true);
    try {
      await fetch(`/api/epics/${epic.id}/markdown`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: editMdValue }),
      });
      setEpic({ ...epic, rawMarkdown: editMdValue });
      await renderMarkdown(editMdValue);
      setEditingMd(false);
      setEditMdValue('');
    } catch {
      alert(t('epic.saveError'));
    }
    setSaving(false);
  };

  const handleCreateStory = async (data: Record<string, string>) => {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        epicId: epic?.id,
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
        storyPoints: data.storyPoints ? parseInt(data.storyPoints) : undefined,
      }),
    });
    const res = await fetch(`/api/epics?id=${params.id}`);
    setEpic(await res.json());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  if (!epic) {
    return (
      <div className="p-8 text-center text-jira-gray-500">
        <p className="text-4xl mb-4">😿</p>
        <p>{t('epic.notFound')}</p>
      </div>
    );
  }

  const doneCount = epic.storiesData?.filter((s) => s.status === 'done').length || 0;
  const totalCount = epic.storiesData?.length || 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-jira-gray-500 mb-6">
        <Link href="/epics" className="hover:text-jira-blue">
          {t('nav.epics')}
        </Link>
        <span>/</span>
        <span className="text-jira-gray-900">{epic.key}</span>
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
          {t('epic.info')}
        </button>
        {epic.rawMarkdown && (
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
            Markdown
          </button>
        )}
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
              <h3 className="text-lg font-semibold text-jira-gray-900">{t('epic.editFile')}</h3>
            </div>
            <p className="text-sm text-jira-gray-600 mb-6">
              {t('epic.editWarning')}
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
              <span className="text-sm font-mono text-jira-gray-600">epics.md — {epic.key}</span>
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
      <>
      <div className="bg-white rounded-lg border border-jira-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <IssueTypeBadge type="epic" />
            <span className="text-sm font-mono text-jira-gray-500">{epic.key}</span>
          </div>
          <StatusBadge status={epic.status} />
        </div>

        <h1 className="text-2xl font-bold text-jira-gray-900 mb-3">{epic.title}</h1>

        <div className="flex items-center gap-4 mb-4">
          <PriorityBadge priority={epic.priority as any} />
          {epic.labels?.map((label) => (
            <span
              key={label}
              className="bg-jira-gray-100 text-jira-gray-600 text-xs px-2 py-0.5 rounded"
            >
              {label}
            </span>
          ))}
        </div>

        {totalCount > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-jira-gray-600">{t('common.progress')}</span>
              <span className="font-medium text-jira-gray-900">
                {doneCount}/{totalCount} {t('dashboard.stories.count')} ({Math.round((doneCount / totalCount) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-jira-gray-200 rounded-full">
              <div
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="prose prose-sm max-w-none">
          <h3 className="text-sm font-semibold text-jira-gray-700 mb-2">{t('epic.description')}</h3>
          <div className="text-sm text-jira-gray-700 whitespace-pre-wrap">
            {epic.description || t('common.noDescription')}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-jira-gray-400">
          <span>{t('epic.created')}: {new Date(epic.createdAt).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</span>
          <span>{t('epic.updated')}: {new Date(epic.updatedAt).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-jira-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-jira-gray-200">
          <h2 className="text-lg font-semibold text-jira-gray-900">
            {t('epic.storiesCount')} ({totalCount})
          </h2>
          <button
            onClick={() => setShowCreateStory(true)}
            className="px-3 py-1.5 bg-jira-blue text-white text-sm rounded-md hover:bg-jira-blue-dark transition-colors"
          >
            {t('epic.createStory')}
          </button>
        </div>

        {!epic.storiesData || epic.storiesData.length === 0 ? (
          <div className="p-8 text-center text-jira-gray-400">
            <p>{t('epic.noStories')}</p>
          </div>
        ) : (
          <div className="divide-y divide-jira-gray-100">
            {epic.storiesData.map((story) => {
              const storyHasFile = story.sourceFile && !story.sourceFile.endsWith('epics.md');
              return (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-jira-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IssueTypeBadge type="story" />
                  <span className="text-xs font-mono text-jira-gray-500">{story.key}</span>
                  <span className="text-sm font-medium text-jira-gray-900">{story.title}</span>
                  {storyHasFile && (
                    <span className="text-xs text-blue-500" title="Есть MD файл">📄</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <PriorityBadge priority={story.priority as any} />
                  {story.storyPoints && (
                    <span className="bg-jira-gray-200 text-jira-gray-700 text-xs font-bold px-1.5 py-0.5 rounded">
                      {story.storyPoints} SP
                    </span>
                  )}
                  <StatusBadge status={story.status} />
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      <CreateModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        title={t('story.createModal')}
        onSubmit={handleCreateStory}
        fields={[
          { name: 'title', label: t('story.name'), type: 'text', required: true, placeholder: t('story.namePlaceholder') },
          { name: 'description', label: t('story.description'), type: 'textarea', placeholder: t('story.descriptionPlaceholder') },
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
          { name: 'storyPoints', label: t('story.storyPoints'), type: 'number', placeholder: '0' },
        ]}
      />
    </div>
  );
}