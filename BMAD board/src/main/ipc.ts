import { ipcMain, BrowserWindow, shell, dialog } from 'electron';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import type { IPCChannels } from '../shared/ipc-channels';
import logger from './logger';
import * as storage from './services/storage';

export function setupIPC(getWindow: () => BrowserWindow | null): void {
  const projectRoot = process.cwd();

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
  });

  ipcMain.handle('project:update', async (_event, params: IPCChannels['project:update']['params']): Promise<IPCChannels['project:update']['result']> => {
    const { projectId, ...updates } = params;
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
}
