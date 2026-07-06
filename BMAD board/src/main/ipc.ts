import { ipcMain, BrowserWindow, shell, dialog } from 'electron';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve, isAbsolute } from 'path';
import { FileWatcher } from './services/file-watcher';
import type {
  FileChangedPayload,
  IPCChannels,
  WatcherErrorPayload,
} from '../shared/ipc-channels';
import logger from './logger';
import * as storage from './services/storage';

export function setupIPC(getWindow: () => BrowserWindow | null): { disposeWatchers: () => void } {
  const projectRoot = process.cwd();

  const fileWatcher = new FileWatcher({
    emit: {
      fileChanged: (payload: FileChangedPayload) => {
        const win = getWindow();
        if (!win || win.isDestroyed()) return;
        win.webContents.send('file:changed', payload);
      },
      watcherError: (payload: WatcherErrorPayload) => {
        const win = getWindow();
        if (!win || win.isDestroyed()) return;
        win.webContents.send('watcher:error', payload);
      },
    },
  });

  ipcMain.handle('config:read', async (): Promise<IPCChannels['config:read']['result']> => {
    const prefs = storage.getAllPrefs();
    return {
      epicsDir: prefs.epicsDir ?? join(projectRoot, '_bmad-output', 'planning-artifacts'),
      storiesDir: prefs.storiesDir ?? join(projectRoot, '_bmad-output', 'implementation-artifacts'),

      lastProjectId: prefs.lastProjectId ?? null,
    };
  });

  ipcMain.handle('config:write', async (_event, params: IPCChannels['config:write']['params']): Promise<void> => {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) storage.setPref(key, value === null ? '' : String(value));
    }
  });

  ipcMain.handle('project:list', async (): Promise<IPCChannels['project:list']['result']> => {
    return storage.getProjects();
  });

  ipcMain.handle('project:switch', async (_event, params: IPCChannels['project:switch']['params']): Promise<void> => {
    const updated = storage.updateProject(params.projectId, { lastUsedAt: new Date().toISOString() });
    if (updated) {
      storage.setPref('lastProjectId', params.projectId);
    }
  });

  ipcMain.handle('project:add', async (_event, params: IPCChannels['project:add']['params']): Promise<IPCChannels['project:add']['result']> => {
    return storage.addProject(params);
  });

  ipcMain.handle('project:remove', async (_event, params: IPCChannels['project:remove']['params']): Promise<void> => {
    const lastProjectId = storage.getPref('lastProjectId');
    if (lastProjectId === params.projectId) {
      storage.setPref('lastProjectId', '');
    }
    const removed = storage.removeProject(params.projectId);
    if (!removed) {
      throw new Error(`Project not found: ${params.projectId}`);
    }
    if (lastProjectId === params.projectId) {
      fileWatcher.stop();
    }
  });

  ipcMain.handle('project:update', async (_event, params: IPCChannels['project:update']['params']): Promise<IPCChannels['project:update']['result']> => {
    const { projectId, ...updates } = params;
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (updates.epicsDir && typeof updates.epicsDir !== 'string') {
      throw new Error('epicsDir must be a string');
    }
    if (updates.storiesDir && typeof updates.storiesDir !== 'string') {
      throw new Error('storiesDir must be a string');
    }
    const updated = storage.updateProject(projectId, updates);
    return updated ?? null;
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

  ipcMain.handle('dialog:openDirectory', async (): Promise<IPCChannels['dialog:openDirectory']['result']> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result;
  });

  ipcMain.handle('watcher:watch', async (_event, params: IPCChannels['watcher:watch']['params']): Promise<void> => {
    const dirs = (params?.dirs ?? []).filter((dir): dir is string => typeof dir === 'string').map((dir: string) =>
      isAbsolute(dir) ? dir : resolve(projectRoot, dir),
    );
    if (dirs.length === 0) {
      logger.warn('[IPC] watcher:watch called with no valid dirs');
      return;
    }
    logger.info(`[IPC] watcher:watch dirs=${dirs.length}`);
    fileWatcher.start(dirs);
  });

  ipcMain.handle('watcher:stop', async (): Promise<void> => {
    logger.info('[IPC] watcher:stop');
    fileWatcher.stop();
  });

  ipcMain.handle('watcher:status', (): IPCChannels['watcher:status']['result'] => {
    return fileWatcher.getStatus();
  });

  return {
    disposeWatchers: () => fileWatcher.stop(),
  };
}
