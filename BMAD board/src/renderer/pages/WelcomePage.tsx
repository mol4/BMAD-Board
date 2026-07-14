import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { setConfig, getConfig } from '@/lib/config';
import { Sparkles, FolderOpen, LayoutDashboard, Folder } from 'lucide-react';
import Input from '@/components/Input';

const steps = [
  {
    key: 'welcome.step1',
    icon: Sparkles,
  },
  {
    key: 'welcome.step2',
    icon: FolderOpen,
  },
  {
    key: 'welcome.step3',
    icon: LayoutDashboard,
  },
] as const;

export default function WelcomePage() {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [epicsDir, setEpicsDir] = useState('');
  const [storiesDir, setStoriesDir] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      setConfig({ epicsDir: epicsDir || undefined, storiesDir: storiesDir || undefined });
      const config = getConfig();
      if (window.electronAPI) {
        await window.electronAPI.configWrite(config);
      }
      window.location.reload();
    } catch {
      setSaving(false);
    }
  };

  const browseFolder = async (setter: (v: string) => void) => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.dialogOpenDirectory();
    if (!result.canceled && result.filePaths[0]) {
      setter(result.filePaths[0]);
    }
  };

  return (
    <div className="bg-surface-base max-w-2xl mx-auto py-8">
      <h1 className="text-display text-foreground-primary mb-8 text-center">
        {t('welcome.title')}
      </h1>

      <div className="space-y-5 mb-10">
        {steps.map(({ key, icon: Icon }, idx) => (
          <div
            key={key}
            className="bg-surface-elevated rounded-lg border border-border-default p-5 flex items-start gap-5"
          >
            <div
              className="bg-accent-subtle rounded-lg flex items-center justify-center shrink-0"
              style={{ width: 48, height: 48 }}
              aria-hidden="true"
            >
              <Icon size={28} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-caption text-foreground-tertiary mb-0.5">
                {t('common.progress')} {idx + 1}
              </p>
              <h3 className="text-h3 text-foreground-primary mb-1">
                {t(`${key}.title`)}
              </h3>
              <p className="text-body-sm text-foreground-secondary">
                {t(`${key}.description`)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <div className="text-center">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-accent text-foreground-on-accent rounded-md hover:bg-accent-hover active:scale-[0.98] transition-transform duration-[80ms] text-sm font-medium"
            aria-label={t('welcome.addProject')}
          >
            {t('welcome.addProject')}
          </button>
        </div>
      ) : (
        <div className="bg-surface-elevated rounded-lg border border-border-default p-5 max-w-md mx-auto space-y-4">
          <div>
            <label
              htmlFor="welcome-epics-dir"
              className="block text-xs text-foreground-tertiary mb-1"
            >
              {t('welcome.epicsDir')}
            </label>
            <div className="flex gap-1">
              <Input
                id="welcome-epics-dir"
                type="text"
                value={epicsDir}
                onChange={(e) => setEpicsDir(e.target.value)}
                className="flex-1 min-w-0 text-xs"
                placeholder="_bmad-output/planning-artifacts"
              />
              <button
                onClick={() => browseFolder(setEpicsDir)}
                className="px-2 py-1.5 bg-surface-elevated border border-border-default rounded hover:bg-accent-subtle transition-colors shrink-0"
                title={t('welcome.browseFolder')}
                aria-label={t('welcome.browseFolder')}
              >
                <Folder size={14} className="text-foreground-tertiary" />
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="welcome-stories-dir"
              className="block text-xs text-foreground-tertiary mb-1"
            >
              {t('welcome.storiesDir')}
            </label>
            <div className="flex gap-1">
              <Input
                id="welcome-stories-dir"
                type="text"
                value={storiesDir}
                onChange={(e) => setStoriesDir(e.target.value)}
                className="flex-1 min-w-0 text-xs"
                placeholder="_bmad-output/implementation-artifacts"
              />
              <button
                onClick={() => browseFolder(setStoriesDir)}
                className="px-2 py-1.5 bg-surface-elevated border border-border-default rounded hover:bg-accent-subtle transition-colors shrink-0"
                title={t('welcome.browseFolder')}
                aria-label={t('welcome.browseFolder')}
              >
                <Folder size={14} className="text-foreground-tertiary" />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-2 py-1.5 bg-accent text-foreground-on-accent text-xs rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('welcome.saveAndLoad')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-2 py-1.5 bg-surface-elevated border border-border-default text-xs rounded text-foreground-secondary hover:bg-accent-subtle transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
