import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import EpicCard from '@/components/EpicCard';

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
        <div className="grid grid-cols-3 gap-4">
          {epics.map((epic) => (
            <EpicCard key={epic.id} epic={epic} />
          ))}
        </div>
      )}
    </div>
  );
}
