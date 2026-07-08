import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { syncEngine } from '@/lib/sync-engine';

let globalAriaMessage = '';
const listeners = new Set<(msg: string) => void>();

export function setGlobalAriaMessage(msg: string): void {
  globalAriaMessage = msg;
  listeners.forEach((fn) => fn(msg));
}

export function getGlobalAriaMessage(): string {
  return globalAriaMessage;
}

function subscribeAria(listener: (msg: string) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSyncAria(): void {
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const handleStart = () => setGlobalAriaMessage(tRef.current('aria.syncing'));
    const handleComplete = () => setGlobalAriaMessage(tRef.current('toast.syncComplete'));
    const handleError = () => setGlobalAriaMessage(tRef.current('toast.syncFailed'));

    const unsubStart = syncEngine.addEventListener('start', handleStart);
    const unsubComplete = syncEngine.addEventListener('complete', handleComplete);
    const unsubError = syncEngine.addErrorListener(handleError);

    return () => {
      unsubStart();
      unsubComplete();
      unsubError();
    };
  }, []);
}

export function AriaLiveRegion(): JSX.Element {
  const [message, setMessage] = useState(() => globalAriaMessage);

  useEffect(() => {
    const unsubscribe = subscribeAria((msg) => setMessage(msg));
    return unsubscribe;
  }, []);

  return (
    <span className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </span>
  );
}
