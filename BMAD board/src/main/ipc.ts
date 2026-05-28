import { ipcMain } from 'electron';
import type { IPCChannels } from '../shared/ipc-channels';
import { v4 as uuidv4 } from 'uuid';

export function setupIPC(): void {
  ipcMain.handle('config:read', async (): Promise<IPCChannels['config:read']['result']> => {
    return {
      epicsDir: '../_bmad-output/planning-artifacts',
      storiesDir: '../_bmad-output/implementation-artifacts',
      storiesMode: 'flat',
      lastProjectId: null,
    };
  });

  ipcMain.handle('config:write', async (_event, params: IPCChannels['config:write']['params']): Promise<void> => {
    console.log('[IPC] config:write', params);
  });

  ipcMain.handle('project:list', async (): Promise<IPCChannels['project:list']['result']> => {
    return [];
  });

  ipcMain.handle('project:switch', async (_event, params: IPCChannels['project:switch']['params']): Promise<void> => {
    console.log('[IPC] project:switch', params.projectId);
  });

  ipcMain.handle('project:add', async (_event, params: IPCChannels['project:add']['params']): Promise<IPCChannels['project:add']['result']> => {
    if (!['nested', 'flat'].includes(params.storiesMode)) {
      throw new Error(`Invalid storiesMode: ${params.storiesMode}. Expected 'nested' or 'flat'.`);
    }
    console.log('[IPC] project:add', params);
    return {
      id: uuidv4(),
      name: params.name,
      epicsDir: params.epicsDir,
      storiesDir: params.storiesDir,
      storiesMode: params.storiesMode,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  });

  ipcMain.handle('project:remove', async (_event, params: IPCChannels['project:remove']['params']): Promise<void> => {
    console.log('[IPC] project:remove', params.projectId);
  });
}
