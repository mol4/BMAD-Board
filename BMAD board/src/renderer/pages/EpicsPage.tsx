import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import Card from '@/components/Card';

export default function EpicsPage() {
  const { t } = useI18n();
  const initialized = useAppStore((s) => s.initialized);
  const epics = useAppStore((s) => s.epics);

  if (!initialized) {
    return (
      <div className="text-center py-12 text-foreground-tertiary">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('epics.title')}</h1>
          <p className="text-sm text-foreground-secondary">{t('epics.subtitle')}</p>
        </div>
      </div>

      {epics.length === 0 ? (
        <div className="text-center py-12 text-foreground-tertiary">
          <p className="text-lg">{t('epics.noEpics')}</p>
          <p className="text-sm mt-2">{t('epics.noEpicsHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {epics.map((epic) => (
            <Card key={epic.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{epic.title}</h3>
                    <span className="text-xs text-foreground-tertiary">{epic.key}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {epic.description || t('common.noDescription')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={epic.status} />
                  <PriorityBadge priority={epic.priority} />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-foreground-tertiary mt-3 pt-3 border-t border-border-default">
                <span>{epic.stories.length} {t('epic.storiesCount')}</span>
                <span>{t('epic.created')}: {new Date(epic.createdAt).toLocaleDateString()}</span>
                {epic.sourceFile && <span>{epic.sourceFile}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
