import { contextBridge, ipcRenderer } from 'electron';
import type { IPCChannels, IPCEventPayloads } from '../shared/ipc-channels';

const electronAPI = {
  configRead: (): Promise<IPCChannels['config:read']['result']> =>
    ipcRenderer.invoke('config:read'),
  configWrite: (params: IPCChannels['config:write']['params']): Promise<void> =>
    ipcRenderer.invoke('config:write', params),
  projectList: (): Promise<IPCChannels['project:list']['result']> =>
    ipcRenderer.invoke('project:list'),
  projectSwitch: (params: IPCChannels['project:switch']['params']): Promise<void> =>
    ipcRenderer.invoke('project:switch', params),
  projectAdd: (params: IPCChannels['project:add']['params']): Promise<IPCChannels['project:add']['result']> =>
    ipcRenderer.invoke('project:add', params),
  projectRemove: (params: IPCChannels['project:remove']['params']): Promise<void> =>
    ipcRenderer.invoke('project:remove', params),
  projectUpdate: (params: IPCChannels['project:update']['params']): Promise<IPCChannels['project:update']['result']> =>
    ipcRenderer.invoke('project:update', params),
  fileRead: (path: string): Promise<IPCChannels['file:read']['result']> =>
    ipcRenderer.invoke('file:read', { path }),
  fileReadDirectory: (path: string): Promise<IPCChannels['file:readDirectory']['result']> =>
    ipcRenderer.invoke('file:readDirectory', { path }),
  windowGetState: (): Promise<IPCChannels['window:getState']['result']> =>
    ipcRenderer.invoke('window:getState'),
  shellOpenPath: (path: string): Promise<IPCChannels['shell:openPath']['result']> =>
    ipcRenderer.invoke('shell:openPath', { path }),
  dialogOpenDirectory: (): Promise<IPCChannels['dialog:openDirectory']['result']> =>
    ipcRenderer.invoke('dialog:openDirectory'),
  watcherWatch: (dirs: string[]): Promise<IPCChannels['watcher:watch']['result']> =>
    ipcRenderer.invoke('watcher:watch', { dirs }),
  watcherStop: (): Promise<IPCChannels['watcher:stop']['result']> =>
    ipcRenderer.invoke('watcher:stop'),
  watcherStatus: (): Promise<IPCChannels['watcher:status']['result']> =>
    ipcRenderer.invoke('watcher:status'),
  onFileChanged: (callback: (payload: IPCEventPayloads['file:changed']) => void): (() => void) => {
    const listener = (_event: unknown, payload: IPCEventPayloads['file:changed']): void => callback(payload);
    ipcRenderer.on('file:changed', listener);
    return () => ipcRenderer.removeListener('file:changed', listener);
  },
  onWatcherError: (callback: (payload: IPCEventPayloads['watcher:error']) => void): (() => void) => {
    const listener = (_event: unknown, payload: IPCEventPayloads['watcher:error']): void => callback(payload);
    ipcRenderer.on('watcher:error', listener);
    return () => ipcRenderer.removeListener('watcher:error', listener);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
