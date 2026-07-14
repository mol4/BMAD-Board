export interface BmadConfig {
  epicsDir: string;
  storiesDir: string;
  lastProjectId: string | null;
}

const defaults: BmadConfig = {
  epicsDir: '_bmad-output/planning-artifacts',
  storiesDir: '_bmad-output/implementation-artifacts',
  lastProjectId: null,
};

let current: BmadConfig = { ...defaults };
let _configLoaded = false;

export type ConfigListener = (config: BmadConfig) => void;
const listeners = new Set<ConfigListener>();

export function subscribeConfig(listener: ConfigListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  const config = getConfig();
  listeners.forEach((listener) => {
    try {
      listener(config);
    } catch (err) {
      console.error('[Config] Listener error:', err);
    }
  });
}

export function getConfig(): BmadConfig {
  return { ...current };
}

export function setConfig(partial: Partial<BmadConfig>): BmadConfig {
  current = { ...current, ...partial };
  notifyListeners();
  return getConfig();
}

export function resetConfig(): BmadConfig {
  current = { ...defaults };
  notifyListeners();
  return getConfig();
}

function resolve(p: string): string {
  return p;
}

export function getEpicsPath(): string {
  return resolve(current.epicsDir);
}

export function getStoriesPath(): string {
  return resolve(current.storiesDir);
}

export function isConfigLoaded(): boolean {
  return _configLoaded;
}

export async function loadConfigFromIPC(): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).electronAPI) {
    console.warn('[Config] electronAPI not available, using defaults');
    _configLoaded = true;
    return;
  }
  try {
    const appConfig = await (window as any).electronAPI.configRead();
    console.log('[Config] Loaded from IPC:', appConfig);
    setConfig({
      epicsDir: appConfig.epicsDir,
      storiesDir: appConfig.storiesDir,
      lastProjectId: appConfig.lastProjectId ?? null,
    });
  } catch (err) {
    console.warn('[Config] IPC config read failed, using defaults:', err);
  }
  _configLoaded = true;
}
