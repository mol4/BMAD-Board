import { contextBridge, ipcRenderer } from 'electron';
import type { IPCChannels } from '../shared/ipc-channels';

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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
