'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import CreateModal from '@/components/CreateModal';
import { useI18n } from '@/lib/i18n';

interface EpicSummary {
  id: string;
  key: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  storyCount: number;
  doneCount: number;
  labels: string[];
  createdAt: string;
}

export default function EpicsPage() {
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { t } = useI18n();

  const fetchEpics = useCallback(async () => {
    const res = await fetch('/api/epics');
    const data = await res.json();
    setEpics(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEpics();
  }, [fetchEpics]);

  const handleCreateEpic = async (data: Record<string, string>) => {
    await fetch('/api/epics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium',
      }),
    });
    fetchEpics();
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
          <h1 className="text-2xl font-bold text-jira-gray-900">{t('epics.title')}</h1>
          <p className="text-sm text-jira-gray-600 mt-1">
            {t('epics.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-jira-blue text-white text-sm font-medium rounded-md hover:bg-jira-blue-dark transition-colors"
        >
          {t('epics.create')}
        </button>
      </div>

      {epics.length === 0 ? (
        <div className="bg-white rounded-lg border border-jira-gray-200 p-12 text-center text-jira-gray-500">
          <p className="text-4xl mb-4">⚡</p>
          <p className="text-lg font-medium mb-2">{t('epics.noEpics')}</p>
          <p className="text-sm">
            {t('epics.noEpicsHint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {epics.map((epic) => (
            <Link
              key={epic.id}
              href={`/epics/${epic.id}`}
              className="bg-white rounded-lg border border-jira-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {epic.key}
                </span>
                <StatusBadge status={epic.status} />
              </div>
              <h3 className="font-semibold text-jira-gray-900 mb-2 group-hover:text-jira-blue transition-colors">
                {epic.title}
              </h3>
              <p className="text-sm text-jira-gray-600 mb-3 line-clamp-2">
                {epic.description || t('common.noDescription')}
              </p>
              <div className="flex items-center justify-between">
                <PriorityBadge priority={epic.priority as any} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-jira-gray-500">
                    {epic.doneCount}/{epic.storyCount}
                  </span>
                  {epic.storyCount > 0 && (
                    <div className="w-16 h-1.5 bg-jira-gray-200 rounded-full">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all"
                        style={{
                          width: `${(epic.doneCount / epic.storyCount) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {epic.labels?.length > 0 && (
                <div className="flex gap-1 mt-3 flex-wrap">
                  {epic.labels.map((label) => (
                    <span
                      key={label}
                      className="bg-jira-gray-100 text-jira-gray-600 text-xs px-2 py-0.5 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <CreateModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('epics.createModal')}
        onSubmit={handleCreateEpic}
        fields={[
          { name: 'title', label: t('epics.name'), type: 'text', required: true, placeholder: t('epics.namePlaceholder') },
          { name: 'description', label: t('epics.description'), type: 'textarea', placeholder: t('epics.descriptionPlaceholder') },
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