import { Navigate } from 'react-router-dom';
import { Box, BookOpen, Target, CheckSquare } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import StatCard from '@/components/StatCard';

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

  if (stats.totalEpics === 0 && stats.totalStories === 0) {
    return <Navigate to="/welcome" replace />;
  }
  const active = stats.storiesByStatus['in-progress'] + stats.storiesByStatus['in-review'];
  const completed = stats.storiesByStatus['done'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t('dashboard.title')}</h1>
      <p className="text-foreground-secondary mb-6">{t('dashboard.subtitle')}</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Box size={24} className="text-white" />}
          iconBg="bg-accent"
          label={t('dashboard.epics')}
          value={stats.totalEpics}
          navigateTo="/epics"
        />
        <StatCard
          icon={<BookOpen size={24} className="text-status-done-fg" />}
          iconBg="bg-status-done-bg"
          label={t('dashboard.stories')}
          value={stats.totalStories}
          navigateTo="/backlog"
        />
        <StatCard
          icon={<Target size={24} className="text-status-in-progress-fg" />}
          iconBg="bg-status-in-progress-bg"
          label={t('dashboard.active')}
          value={active}
          subtitle={t('dashboard.activeSubtitle')}
          navigateTo="/board"
        />
        <StatCard
          icon={<CheckSquare size={24} className="text-status-done-fg" />}
          iconBg="bg-status-done-bg"
          label={t('dashboard.completedCard')}
          value={completed}
          navigateTo="/board"
        />
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
        </div>
      )}
    </div>
  );
}
