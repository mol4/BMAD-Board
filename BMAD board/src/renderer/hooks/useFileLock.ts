import { useState, useEffect, useCallback, useRef } from 'react';

interface FileLockState {
  locked: boolean;
  owner: 'ui' | 'agent' | null;
}

interface UseFileLockResult {
  locked: boolean;
  owner: 'ui' | 'agent' | null;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
}

export function useFileLock(filePath: string | null): UseFileLockResult {
  const [state, setState] = useState<FileLockState>({ locked: false, owner: null });
  const acquiredRef = useRef(false);
  const mountedRef = useRef(true);
  const pendingAcquireRef = useRef<Promise<{ acquired: boolean; owner?: 'ui' | 'agent' }> | null>(null);

  const checkStatus = useCallback(async () => {
    if (!filePath) return;
    try {
      const result = await window.electronAPI?.fileLockStatus({ path: filePath });
      if (mountedRef.current && result) {
        setState({ locked: result.acquired, owner: result.owner ?? null });
      }
    } catch {
      // Ignore
    }
  }, [filePath]);

  useEffect(() => {
    mountedRef.current = true;
    checkStatus();

    return () => {
      mountedRef.current = false;
    };
  }, [checkStatus]);

  const acquire = useCallback(async (): Promise<boolean> => {
    if (!filePath) return false;
    try {
      const promise = window.electronAPI?.fileLock({ path: filePath, owner: 'ui' });
      if (!promise) return false;
      pendingAcquireRef.current = promise;
      const result = await promise;
      pendingAcquireRef.current = null;
      if (!result) return false;
      if (mountedRef.current) {
        setState({ locked: result.acquired, owner: result.owner ?? null });
      }
      if (result.acquired) {
        acquiredRef.current = true;
      }
      return result.acquired;
    } catch {
      pendingAcquireRef.current = null;
      return false;
    }
  }, [filePath]);

  const release = useCallback(async () => {
    if (!filePath) return;
    try {
      await window.electronAPI?.fileUnlock({ path: filePath });
      if (mountedRef.current) {
        setState({ locked: false, owner: null });
      }
      acquiredRef.current = false;
    } catch {
      // Ignore
    }
  }, [filePath]);

  useEffect(() => {
    return () => {
      if (pendingAcquireRef.current) {
        pendingAcquireRef.current.then((acquired) => {
          if (acquired.acquired && filePath) {
            window.electronAPI?.fileUnlock({ path: filePath }).catch?.(() => {});
          }
        }).catch(() => {});
        pendingAcquireRef.current = null;
      } else if (acquiredRef.current && filePath) {
        window.electronAPI?.fileUnlock({ path: filePath })?.catch?.(() => {});
      }
      acquiredRef.current = false;
    };
  }, [filePath]);

  return { locked: state.locked, owner: state.owner, acquire, release };
}
