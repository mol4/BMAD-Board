'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface DiagConfig {
  epicsDir: string;
  storiesDir: string;
  storiesMode: string;
  resolvedEpicsPath: string;
  resolvedStoriesPath: string;
}

interface EpicDiag {
  key: string;
  title: string;
  status: string;
  totalStories: number;
  fileStories: number;
  inlineStories: number;
  storiesByStatus: Record<string, number>;
}

interface StoryDiag {
  key: string;
  title: string;
  epicId: string;
  status: string;
  source: 'inline' | 'file';
  sourceFile: string | null;
  acceptanceCriteriaCount: number;
}

interface DiagData {
  config: DiagConfig;
  filesOnDisk: { epicsDir: string[]; storiesDir: string[] };
  summary: {
    totalEpics: number;
    totalStories: number;
    fileBasedStories: number;
    inlineStories: number;
  };
  epics: EpicDiag[];
  stories: StoryDiag[];
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { t } = useI18n();

  const load = () => {
    setLoading(true);
    fetch('/api/diagnostics')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  };

  const resync = async () => {
    setSyncing(true);
    await fetch('/api/sync', { method: 'POST' });
    load();
    setSyncing(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-jira-gray-900">{t('diag.title')}</h1>
          <p className="text-sm text-jira-gray-600 mt-1">
            {t('diag.subtitle')}
          </p>
        </div>
        <button
          onClick={resync}
          disabled={syncing}
          className="px-4 py-2 bg-jira-blue text-white rounded-lg hover:bg-jira-blue-dark transition-colors text-sm font-medium disabled:opacity-50"
        >
          {syncing ? t('diag.syncing') : t('diag.resync')}
        </button>
      </div>

      <Section title={t('diag.config')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigRow label={t('diag.mode')} value={data.config.storiesMode} />
          <ConfigRow label={t('diag.epicsPathConfig')} value={data.config.epicsDir} />
          <ConfigRow label={t('diag.storiesPathConfig')} value={data.config.storiesDir} />
          <ConfigRow label={t('diag.resolvedEpicsPath')} value={data.config.resolvedEpicsPath} />
          <ConfigRow label={t('diag.resolvedStoriesPath')} value={data.config.resolvedStoriesPath} />
        </div>
      </Section>

      <Section title={t('diag.filesOnDisk')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-jira-gray-700 mb-2">
              epicsDir ({data.filesOnDisk.epicsDir.length} {t('diag.files')})
            </h4>
            <ul className="space-y-1">
              {data.filesOnDisk.epicsDir.map((f) => (
                <li key={f} className="text-xs text-jira-gray-600 font-mono bg-jira-gray-100 px-2 py-1 rounded">
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-jira-gray-700 mb-2">
              storiesDir ({data.filesOnDisk.storiesDir.length} {t('diag.files')})
            </h4>
            <ul className="space-y-1">
              {data.filesOnDisk.storiesDir.map((f) => (
                <li key={f} className="text-xs text-jira-gray-600 font-mono bg-jira-gray-100 px-2 py-1 rounded">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title={t('diag.importSummary')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label={t('diag.totalEpics')} value={data.summary.totalEpics} color="bg-purple-50 text-purple-700" />
          <SummaryCard label={t('diag.totalStories')} value={data.summary.totalStories} color="bg-green-50 text-green-700" />
          <SummaryCard
            label={t('diag.fromFiles')}
            value={data.summary.fileBasedStories}
            color="bg-blue-50 text-blue-700"
          />
          <SummaryCard
            label={t('diag.fromEpicsMd')}
            value={data.summary.inlineStories}
            color="bg-amber-50 text-amber-700"
          />
        </div>
      </Section>

      <Section title={t('diag.epicsTable')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-jira-gray-200 text-left text-jira-gray-600">
                <th className="py-2 px-3 font-medium">{t('diag.key')}</th>
                <th className="py-2 px-3 font-medium">{t('diag.name')}</th>
                <th className="py-2 px-3 font-medium">{t('diag.status')}</th>
                <th className="py-2 px-3 font-medium text-center">{t('diag.total')}</th>
                <th className="py-2 px-3 font-medium text-center">{t('diag.fromFiles')}</th>
                <th className="py-2 px-3 font-medium text-center">{t('diag.inline')}</th>
                <th className="py-2 px-3 font-medium">{t('diag.byStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {data.epics.map((e) => (
                <tr key={e.key} className="border-b border-jira-gray-100 hover:bg-jira-gray-50">
                  <td className="py-2 px-3 font-mono text-xs font-semibold text-jira-blue">{e.key}</td>
                  <td className="py-2 px-3 text-jira-gray-900 max-w-xs truncate">{e.title}</td>
                  <td className="py-2 px-3">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="py-2 px-3 text-center font-semibold">{e.totalStories}</td>
                  <td className="py-2 px-3 text-center text-blue-600">{e.fileStories}</td>
                  <td className="py-2 px-3 text-center text-amber-600">{e.inlineStories}</td>
                  <td className="py-2 px-3">
                    <StatusBar counts={e.storiesByStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t('diag.storiesTable')}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-jira-gray-200 text-left text-jira-gray-600">
                <th className="py-2 px-3 font-medium">{t('diag.key')}</th>
                <th className="py-2 px-3 font-medium">{t('diag.name')}</th>
                <th className="py-2 px-3 font-medium">{t('diag.epicCol')}</th>
                <th className="py-2 px-3 font-medium">{t('diag.status')}</th>
                <th className="py-2 px-3 font-medium">{t('diag.source')}</th>
                <th className="py-2 px-3 font-medium text-center">AC</th>
              </tr>
            </thead>
            <tbody>
              {data.stories
                .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
                .map((s) => (
                  <tr key={s.key} className="border-b border-jira-gray-100 hover:bg-jira-gray-50">
                    <td className="py-2 px-3 font-mono text-xs font-semibold text-jira-blue">{s.key}</td>
                    <td className="py-2 px-3 text-jira-gray-900 max-w-sm truncate">{s.title}</td>
                    <td className="py-2 px-3 font-mono text-xs text-jira-gray-600">{s.epicId}</td>
                    <td className="py-2 px-3">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.source === 'file'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {s.source === 'file' ? t('diag.fileSource') : t('diag.inlineSource')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-jira-gray-600">{s.acceptanceCriteriaCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-jira-gray-900 mb-4 border-b border-jira-gray-200 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-jira-gray-500 font-medium">{label}</span>
      <span className="text-sm text-jira-gray-900 font-mono bg-jira-gray-100 px-2 py-1 rounded truncate">
        {value}
      </span>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    ready: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    'in-review': 'bg-purple-100 text-purple-700',
    done: 'bg-green-100 text-green-700',
    backlog: 'bg-gray-100 text-gray-600',
    todo: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function StatusBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return <span className="text-xs text-jira-gray-400">—</span>;

  const colors: Record<string, string> = {
    backlog: 'bg-gray-300',
    todo: 'bg-slate-400',
    'in-progress': 'bg-yellow-400',
    'in-review': 'bg-purple-400',
    done: 'bg-green-400',
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex h-2 w-24 rounded-full overflow-hidden bg-gray-100">
        {['done', 'in-review', 'in-progress', 'todo', 'backlog'].map((s) => {
          const w = counts[s] ? (counts[s] / total) * 100 : 0;
          if (w === 0) return null;
          return <div key={s} className={`${colors[s]} h-full`} style={{ width: `${w}%` }} />;
        })}
      </div>
      <span className="text-xs text-jira-gray-500 ml-1">{counts.done || 0}/{total}</span>
    </div>
  );
}