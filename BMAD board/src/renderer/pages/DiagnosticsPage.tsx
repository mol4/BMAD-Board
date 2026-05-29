import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { initializeStore, getSprintMeta } from '@/lib/markdown-parser';
import { getConfig } from '@/lib/config';

export default function DiagnosticsPage() {
  const { t } = useI18n();
  const initialized = useAppStore((s) => s.initialized);
  const [syncing, setSyncing] = useState(false);
  const getStats = useAppStore((s) => s.getStats);
  const getAllEpics = useAppStore((s) => s.getAllEpics);
  const clear = useAppStore((s) => s.clear);

  if (!initialized) {
    return (
      <div className="text-center py-12 text-jira-gray-500">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  const stats = getStats();
  const config = getConfig();
  const sprintMeta = getSprintMeta();

  const handleResync = () => {
    setSyncing(true);
    clear();
    useAppStore.getState().setInitialized(false);
    initializeStore().finally(() => setSyncing(false));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('diag.title')}</h1>
          <p className="text-sm text-jira-gray-400">{t('diag.subtitle')}</p>
        </div>
        <button
          onClick={handleResync}
          disabled={syncing}
          className="px-4 py-2 bg-jira-blue text-white text-sm rounded-md hover:bg-jira-blue-dark transition-colors disabled:opacity-50"
        >
          {syncing ? t('diag.syncing') : t('diag.resync')}
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('diag.config')}</h2>
          <div className="grid grid-cols-2 gap-4 bg-jira-gray-800 rounded-lg p-4">
            <div>
              <div className="text-xs text-jira-gray-500">{t('diag.epicsPathConfig')}</div>
              <div className="text-sm font-mono">{config.epicsDir}</div>
            </div>
            <div>
              <div className="text-xs text-jira-gray-500">{t('diag.storiesPathConfig')}</div>
              <div className="text-sm font-mono">{config.storiesDir}</div>
            </div>
            <div>
              <div className="text-xs text-jira-gray-500">{t('diag.mode')}</div>
              <div className="text-sm font-mono">{config.storiesMode}</div>
            </div>
            {sprintMeta && (
              <div>
                <div className="text-xs text-jira-gray-500">Sprint Status</div>
                <div className="text-sm font-mono">
                  {sprintMeta.project} / {sprintMeta.lastUpdated || sprintMeta.generated}
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">{t('diag.importSummary')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-jira-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-jira-blue">{stats.totalEpics}</div>
              <div className="text-xs text-jira-gray-500">{t('diag.totalEpics')}</div>
            </div>
            <div className="bg-jira-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.totalStories}</div>
              <div className="text-xs text-jira-gray-500">{t('diag.totalStories')}</div>
            </div>
            <div className="bg-jira-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.totalTasks}</div>
              <div className="text-xs text-jira-gray-500">{t('dashboard.tasks')}</div>
            </div>
            <div className="bg-jira-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.totalStoryPoints}</div>
              <div className="text-xs text-jira-gray-500">{t('dashboard.storyPoints')}</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">{t('diag.byStatus')}</h2>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(stats.storiesByStatus).map(([status, count]) => (
              <div key={status} className="bg-jira-gray-800 rounded-lg p-3 text-center">
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-jira-gray-500">{status}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">{t('diag.epicsTable')}</h2>
          {getAllEpics().length === 0 ? (
            <p className="text-sm text-jira-gray-500">{t('epics.noEpics')}</p>
          ) : (
            <div className="space-y-2">
              {getAllEpics().map((epic) => (
                <div key={epic.id} className="flex items-center gap-4 p-2 bg-jira-gray-800 rounded text-sm">
                  <span className="font-mono text-jira-blue w-20">{epic.key}</span>
                  <span className="flex-1">{epic.title}</span>
                  <span className="text-jira-gray-500">{epic.status}</span>
                  <span className="text-jira-gray-500">{epic.stories.length} {t('diag.total')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
