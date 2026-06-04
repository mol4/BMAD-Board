import { useEffect, useState } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { loadConfigFromIPC, getConfig } from '@/lib/config';
import { initializeStore } from '@/lib/markdown-parser';
import { useAppStore } from '@/lib/store';
import { ToastProvider } from '@/components/Toast';

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
        await initializeStore();
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
    <ToastProvider>
      <I18nProvider>{children}</I18nProvider>
    </ToastProvider>
  );
}
