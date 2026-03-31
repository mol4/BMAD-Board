'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useI18n } from '@/lib/i18n';

interface Stats {
  totalEpics: number;
  totalStories: number;
  totalTasks: number;
  storiesByStatus: Record<string, number>;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

interface EpicSummary {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  storyCount: number;
  doneCount: number;
}

interface DocSummary {
  id: string;
  name: string;
  fileName: string;
  relPath: string;
  category: string;
  ext: string;
  size: number;
  updatedAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useI18n();

  useEffect(() => {
    Promise.all([
      fetch('/api/sync').then((r) => r.json()),
      fetch('/api/epics').then((r) => r.json()),
      fetch('/api/docs').then((r) => r.json()),
    ]).then(([statsData, epicsData, docsData]) => {
      setStats(statsData);
      setEpics(epicsData);
      setDocs(docsData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  const completionPercent = stats
    ? stats.totalStoryPoints > 0
      ? Math.round((stats.completedStoryPoints / stats.totalStoryPoints) * 100)
      : 0
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-jira-gray-900">{t('dashboard.title')}</h1>
        <p className="text-sm text-jira-gray-600 mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t('dashboard.epics')}
          value={stats?.totalEpics || 0}
          icon="⚡"
          color="bg-purple-50 text-purple-700"
        />
        <StatCard
          title={t('dashboard.stories')}
          value={stats?.totalStories || 0}
          icon="📖"
          color="bg-green-50 text-green-700"
        />
        <StatCard
          title={t('dashboard.tasks')}
          value={stats?.totalTasks || 0}
          icon="✅"
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title={t('dashboard.storyPoints')}
          value={`${stats?.completedStoryPoints || 0} / ${stats?.totalStoryPoints || 0}`}
          icon="🎯"
          color="bg-orange-50 text-orange-700"
          subtitle={`${completionPercent}% ${t('dashboard.completed')}`}
        />
      </div>

      {stats && stats.totalStories > 0 && (
        <div className="bg-white rounded-lg border border-jira-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-jira-gray-900 mb-4">
            {t('dashboard.statusDistribution')}
          </h2>
          <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
            {Object.entries(stats.storiesByStatus).map(([status, count]) => {
              if (count === 0) return null;
              const percent = (count / stats.totalStories) * 100;
              const colors: Record<string, string> = {
                backlog: 'bg-gray-300',
                todo: 'bg-blue-400',
                'in-progress': 'bg-yellow-400',
                'in-review': 'bg-purple-400',
                done: 'bg-green-400',
              };
              return (
                <div
                  key={status}
                  className={`${colors[status] || 'bg-gray-300'} flex items-center justify-center text-xs font-medium text-white`}
                  style={{ width: `${percent}%` }}
                  title={`${status}: ${count}`}
                >
                  {percent > 10 ? count : ''}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-jira-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-300 inline-block"></span> {t('status.backlog')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-400 inline-block"></span> {t('status.todo')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-400 inline-block"></span> {t('status.in-progress')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-400 inline-block"></span> {t('status.in-review')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-400 inline-block"></span> {t('status.done')}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-jira-gray-200">
        <div className="px-6 py-4 border-b border-jira-gray-200">
          <h2 className="text-lg font-semibold text-jira-gray-900">{t('dashboard.epics')}</h2>
        </div>
        {epics.length === 0 ? (
          <div className="p-12 text-center text-jira-gray-500">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-lg font-medium mb-2">{t('dashboard.noEpics')}</p>
            <p className="text-sm">
              {t('dashboard.addMarkdownFiles')}{' '}
              <code className="bg-jira-gray-100 px-2 py-0.5 rounded">
                _bmad-output/planning-artifacts/epics/
              </code>
            </p>
            <p className="text-sm mt-1">{t('dashboard.orCreateEpic')}</p>
          </div>
        ) : (
          <div className="divide-y divide-jira-gray-200">
            {epics.map((epic) => (
              <Link
                key={epic.id}
                href={`/epics/${epic.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-jira-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-jira-gray-500 w-16">{epic.key}</span>
                  <div>
                    <p className="font-medium text-jira-gray-900">{epic.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={epic.status} />
                      <PriorityBadge priority={epic.priority as any} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-jira-gray-600">
                    {epic.doneCount} / {epic.storyCount} {t('dashboard.stories.count')}
                  </p>
                  {epic.storyCount > 0 && (
                    <div className="w-24 h-1.5 bg-jira-gray-200 rounded-full mt-1">
                      <div
                        className="h-full bg-green-400 rounded-full"
                        style={{
                          width: `${(epic.doneCount / epic.storyCount) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-jira-gray-200 mt-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-jira-gray-200">
          <h2 className="text-lg font-semibold text-jira-gray-900">
            {t('dashboard.projectDocs')} ({docs.length})
          </h2>
          <Link
            href="/docs"
            className="text-sm text-jira-blue hover:text-jira-blue-dark transition-colors"
          >
            {t('dashboard.allDocs')}
          </Link>
        </div>
        {docs.length === 0 ? (
          <div className="p-8 text-center text-jira-gray-500">
            <p className="text-3xl mb-2">📄</p>
            <p className="text-sm">{t('dashboard.noDocs')}</p>
          </div>
        ) : (
          <div className="divide-y divide-jira-gray-100">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/docs/${doc.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-jira-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                    doc.ext === 'html' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {doc.ext.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-jira-gray-900">{doc.name}</p>
                    <p className="text-xs text-jira-gray-400">{doc.category}</p>
                  </div>
                </div>
                <div className="text-xs text-jira-gray-400">
                  {new Date(doc.updatedAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-jira-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-jira-gray-600">{title}</p>
          <p className="text-2xl font-bold text-jira-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-jira-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}