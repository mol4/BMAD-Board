import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

export default function DashboardPage() {
  const { t } = useI18n();
  const initialized = useAppStore((s) => s.initialized);
  const getStats = useAppStore((s) => s.getStats);

  if (!initialized) {
    return (
      <div className="text-center py-12 text-foreground-tertiary">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  const stats = getStats();
  const active = stats.storiesByStatus['in-progress'] + stats.storiesByStatus['in-review'];
  const completed = stats.storiesByStatus['done'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t('dashboard.title')}</h1>
      <p className="text-foreground-secondary mb-6">{t('dashboard.subtitle')}</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-elevated rounded-lg p-4">
          <div className="text-3xl font-bold text-accent">{stats.totalEpics}</div>
          <div className="text-sm text-foreground-tertiary">{t('dashboard.epics')}</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-4">
          <div className="text-3xl font-bold text-status-done-fg">{stats.totalStories}</div>
          <div className="text-sm text-foreground-tertiary">{t('dashboard.stories')}</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-4">
          <div className="text-3xl font-bold text-status-in-progress-fg">{active}</div>
          <div className="text-sm text-foreground-tertiary">{t('dashboard.active')}</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-4">
          <div className="text-3xl font-bold text-status-done-fg">{completed}</div>
          <div className="text-sm text-foreground-tertiary">{t('dashboard.completedCard')}</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">{t('dashboard.statusDistribution')}</h2>
      {stats.totalStories > 0 ? (
        <div className="space-y-2">
          {Object.entries(stats.storiesByStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-sm text-foreground-tertiary w-24">{status}</span>
              <div className="flex-1 bg-surface-sunken rounded-full h-5 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all"
                  style={{ width: `${stats.totalStories > 0 ? (count / stats.totalStories) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-foreground-tertiary">
          <p>{t('dashboard.noEpics')}</p>
          <p className="text-sm mt-1">{t('dashboard.orCreateEpic')}</p>
        </div>
      )}
    </div>
  );
}
