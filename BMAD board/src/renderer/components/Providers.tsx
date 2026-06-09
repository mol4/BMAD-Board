import { useEffect, useState } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { loadConfigFromIPC, getConfig } from '@/lib/config';
import { initializeStore } from '@/lib/markdown-parser';
import { useAppStore } from '@/lib/store';
import { storeManager } from '@/lib/store-manager';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        console.log('[Providers] Starting initialization...');
        await loadConfigFromIPC();
        const config = getConfig();
        console.log('[Providers] Config loaded:', config);

        if (config.lastProjectId && typeof window !== 'undefined' && window.electronAPI) {
          const projects = await window.electronAPI.projectList();
          if (projects && Array.isArray(projects) && projects.length > 0) {
            const lastProject = projects.find((p) => p.id === config.lastProjectId);
            if (lastProject) {
              console.log('[Providers] Auto-loading last project:', lastProject.id);
              await storeManager.switchProject(lastProject.id);
            } else {
              console.log('[Providers] Last project not found, initializing default');
              await initializeStore();
            }
          } else {
            await initializeStore();
          }
        } else {
          await initializeStore();
        }

        const state = useAppStore.getState();
        console.log('[Providers] Store initialized. Epics:', state.epics.length, 'Stories:', state.stories.length);
      } catch (err) {
        console.error('[Providers] Init failed:', err);
        setError(String(err));
      } finally {
        setReady(true);
      }
    }
    init();
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen text-foreground-tertiary">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <I18nProvider>{children}</I18nProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
