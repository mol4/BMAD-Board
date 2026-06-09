export interface BmadConfig {
  epicsDir: string;
  storiesDir: string;
  storiesMode: 'nested' | 'flat';
  lastProjectId: string | null;
}

const defaults: BmadConfig = {
  epicsDir: '_bmad-output/planning-artifacts',
  storiesDir: '_bmad-output/implementation-artifacts',
  storiesMode: 'flat',
  lastProjectId: null,
};

let current: BmadConfig = { ...defaults };
let _configLoaded = false;

export function getConfig(): BmadConfig {
  return { ...current };
}

export function setConfig(partial: Partial<BmadConfig>): BmadConfig {
  current = { ...current, ...partial };
  return getConfig();
}

export function resetConfig(): BmadConfig {
  current = { ...defaults };
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
    current = {
      epicsDir: appConfig.epicsDir,
      storiesDir: appConfig.storiesDir,
      storiesMode: appConfig.storiesMode,
      lastProjectId: appConfig.lastProjectId ?? null,
    };
  } catch (err) {
    console.warn('[Config] IPC config read failed, using defaults:', err);
  }
  _configLoaded = true;
}
