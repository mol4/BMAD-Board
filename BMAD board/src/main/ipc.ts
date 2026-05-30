import { ipcMain, BrowserWindow, shell } from 'electron';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import type { IPCChannels } from '../shared/ipc-channels';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

export function setupIPC(getWindow: () => BrowserWindow | null): void {
  const projectRoot = process.cwd();

  ipcMain.handle('config:read', async (): Promise<IPCChannels['config:read']['result']> => {
    const result: IPCChannels['config:read']['result'] = {
      epicsDir: join(projectRoot, '_bmad-output', 'planning-artifacts'),
      storiesDir: join(projectRoot, '_bmad-output', 'implementation-artifacts'),
      storiesMode: 'flat',
      lastProjectId: null,
    };
    return result;
  });

  ipcMain.handle('config:write', async (_event, params: IPCChannels['config:write']['params']): Promise<void> => {
    logger.info('[IPC] config:write', params);
  });

  ipcMain.handle('project:list', async (): Promise<IPCChannels['project:list']['result']> => {
    return [];
  });

  ipcMain.handle('project:switch', async (_event, params: IPCChannels['project:switch']['params']): Promise<void> => {
    logger.info('[IPC] project:switch', params.projectId);
  });

  ipcMain.handle('project:add', async (_event, params: IPCChannels['project:add']['params']): Promise<IPCChannels['project:add']['result']> => {
    if (!['nested', 'flat'].includes(params.storiesMode)) {
      throw new Error(`Invalid storiesMode: ${params.storiesMode}. Expected 'nested' or 'flat'.`);
    }
    logger.info('[IPC] project:add', params);
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
    logger.info('[IPC] project:remove', params.projectId);
  });

  ipcMain.handle('file:read', async (_event, params: IPCChannels['file:read']['params']): Promise<IPCChannels['file:read']['result']> => {
    try {
      const resolved = resolve(params.path);
      try {
        await stat(resolved);
      } catch {
        return { content: '', exists: false };
      }
      const content = await readFile(resolved, 'utf-8');
      return { content, exists: true };
    } catch (err) {
      logger.error(`[IPC] file:read error for ${params.path}:`, err);
      return { content: '', exists: false };
    }
  });

  ipcMain.handle('file:readDirectory', async (_event, params: IPCChannels['file:readDirectory']['params']): Promise<IPCChannels['file:readDirectory']['result']> => {
    try {
      const resolved = resolve(params.path);
      const entries = await readdir(resolved, { withFileTypes: true });
      const result = entries.map((entry) => ({
        name: entry.name,
        path: join(resolved, entry.name),
        isFile: entry.isFile(),
      }));
      return result;
    } catch (err) {
      logger.error(`[IPC] file:readDirectory error for ${params.path}:`, err);
      return [];
    }
  });

  ipcMain.handle('window:getState', (): IPCChannels['window:getState']['result'] => {
    const win = getWindow();
    if (!win || win.isDestroyed()) return { isMaximized: false };
    return { isMaximized: win.isMaximized() };
  });

  ipcMain.handle('shell:openPath', async (_event, params: IPCChannels['shell:openPath']['params']): Promise<IPCChannels['shell:openPath']['result']> => {
    const error = await shell.openPath(params.path);
    return { error };
  });
}
