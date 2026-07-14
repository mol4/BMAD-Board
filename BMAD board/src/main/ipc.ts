import { ipcMain, BrowserWindow, shell, dialog } from 'electron';
import { readFile, readdir, stat, writeFile, rename, unlink, copyFile } from 'fs/promises';
import { join, resolve, isAbsolute, dirname } from 'path';
import { randomUUID } from 'crypto';
import { FileWatcher } from './services/file-watcher';
import { fileLockManager } from './services/file-lock';
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

  fileLockManager.startCleanup(30000);

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

  ipcMain.handle('file:write', async (_event, params: IPCChannels['file:write']['params']): Promise<IPCChannels['file:write']['result']> => {
    const resolved = resolve(params.path);

    if (!resolved.startsWith(resolve(projectRoot))) {
      logger.warn(`[IPC] file:write rejected: path ${resolved} is outside project root`);
      const err = new Error('Path is outside project directory') as Error & { code: string };
      err.code = 'FILE_WRITE_ERROR';
      throw err;
    }

    let tempPath: string | null = null;
    let lockAcquired = false;
    let renameSucceeded = false;

    try {
      const lockResult = await fileLockManager.acquire(resolved, 'ui');
      if (!lockResult.acquired) {
        logger.info(`[IPC] file:write lock denied for ${resolved}, owner=${lockResult.owner}`);
        const err = new Error('File is locked by another process') as Error & { code: string };
        err.code = 'FILE_LOCKED';
        throw err;
      }
      lockAcquired = true;

      if (params.lastMtimeMs !== undefined) {
        try {
          const fileStat = await stat(resolved);
          if (fileStat.mtimeMs !== params.lastMtimeMs) {
            logger.info(`[IPC] file:write mtime mismatch for ${resolved}`);
            const err = new Error('File changed by another process') as Error & { code: string };
            err.code = 'FILE_CHANGED';
            throw err;
          }
        } catch (statErr: unknown) {
          const se = statErr as NodeJS.ErrnoException;
          if (se.code === 'ENOENT') {
            if (params.lastMtimeMs !== 0) {
              logger.info(`[IPC] file:write file deleted for ${resolved}`);
              const err = new Error('File changed by another process') as Error & { code: string };
              err.code = 'FILE_CHANGED';
              throw err;
            }
          } else {
            logger.error(`[IPC] file:write stat failed for ${resolved}:`, statErr);
            const err = new Error('File changed by another process') as Error & { code: string };
            err.code = 'FILE_CHANGED';
            throw err;
          }
        }
      }

      const dir = dirname(resolved);
      tempPath = join(dir, `.bmad-tmp-${randomUUID()}.md`);

      await writeFile(tempPath, params.content, 'utf-8');
      try {
        await rename(tempPath, resolved);
      } catch (renameErr: unknown) {
        const re = renameErr as NodeJS.ErrnoException;
        if (re.code === 'EPERM' || re.code === 'EBUSY') {
          logger.warn(`[IPC] file:write rename failed (${re.code}) for ${resolved}, falling back to copy+unlink`);
          await copyFile(tempPath, resolved);
          await unlink(tempPath);
        } else {
          throw renameErr;
        }
      }
      tempPath = null;
      renameSucceeded = true;

      const newStat = await stat(resolved);

      await fileLockManager.release(resolved);
      lockAcquired = false;

      logger.info(`[IPC] file:write succeeded for ${resolved}, mtimeMs=${newStat.mtimeMs}`);
      return { mtimeMs: newStat.mtimeMs };
    } catch (err: unknown) {
      if (tempPath) {
        try { await unlink(tempPath); } catch { /* best effort */ }
      }
      if (lockAcquired) {
        try { await fileLockManager.release(resolved); } catch { /* best effort */ }
      }

      const e = err as Error & { code?: string };
      if (e.code === 'FILE_LOCKED' || e.code === 'FILE_CHANGED') {
        throw err;
      }

      if (renameSucceeded) {
        logger.warn(`[IPC] file:write rename succeeded but post-stat failed for ${resolved}:`, err);
        try {
          const fallbackStat = await stat(resolved);
          return { mtimeMs: fallbackStat.mtimeMs };
        } catch {
          logger.error(`[IPC] file:write fallback stat also failed for ${resolved}:`, err);
        }
      }

      logger.error(`[IPC] file:write error for ${resolved}:`, err);

      const wrapped = new Error(e.message || 'File write failed') as Error & { code: string };
      wrapped.code = 'FILE_WRITE_ERROR';
      throw wrapped;
    }
  });

  ipcMain.handle('file:lock', async (_event, params: IPCChannels['file:lock']['params']): Promise<IPCChannels['file:lock']['result']> => {
    try {
      const resolved = resolve(params.path);
      return await fileLockManager.acquire(resolved, params.owner);
    } catch (err) {
      logger.error(`[IPC] file:lock error for ${params.path}:`, err);
      return { acquired: false };
    }
  });

  ipcMain.handle('file:unlock', async (_event, params: IPCChannels['file:unlock']['params']): Promise<void> => {
    try {
      const resolved = resolve(params.path);
      await fileLockManager.release(resolved);
    } catch (err) {
      logger.error(`[IPC] file:unlock error for ${params.path}:`, err);
    }
  });

  ipcMain.handle('file:lockStatus', async (_event, params: IPCChannels['file:lockStatus']['params']): Promise<IPCChannels['file:lockStatus']['result']> => {
    try {
      const resolved = resolve(params.path);
      return await fileLockManager.getStatus(resolved);
    } catch (err) {
      logger.error(`[IPC] file:lockStatus error for ${params.path}:`, err);
      return { acquired: false };
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
    disposeWatchers: () => {
      fileWatcher.stop();
      fileLockManager.stopCleanup();
    },
  };
}
