import { useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { useI18n } from '@/lib/i18n';
import { syncEngine } from '@/lib/sync-engine';

export function useFileWatcher(): void {
  const { showToast } = useToast();
  const { t } = useI18n();
  const mountedRef = useRef(true);
  const showToastRef = useRef(showToast);
  const tRef = useRef(t);

  useEffect(() => {
    showToastRef.current = showToast;
    tRef.current = t;
  }, [showToast, t]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;
    mountedRef.current = true;

    const unsubChanged = window.electronAPI.onFileChanged((payload) => {
      if (!payload?.changes?.length) return;
      syncEngine
        .processChanges(payload.changes)
        .then(() => {
          if (mountedRef.current) {
            showToastRef.current(tRef.current('toast.syncTriggered'), 'success');
          }
        })
        .catch((err) => {
          console.error('[Watcher] Sync failed:', err);
          if (mountedRef.current) {
            showToastRef.current(tRef.current('toast.syncError'), 'error');
          }
        });
    });

    const unsubError = window.electronAPI.onWatcherError((error) => {
      console.error('[Watcher] error:', error);
      if (!mountedRef.current) return;
      if (error.code === 'WATCH_DIR_LOST') {
        showToastRef.current(tRef.current('toast.watchDirLost'), 'error');
      } else if (error.code === 'FILE_LOCKED') {
        showToastRef.current(tRef.current('toast.fileLocked'), 'error');
      } else {
        showToastRef.current(tRef.current('toast.watcherError'), 'error');
      }
    });

    return () => {
      mountedRef.current = false;
      unsubChanged();
      unsubError();
    };
  }, []);
}
