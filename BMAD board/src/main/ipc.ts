import { ipcMain } from 'electron';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import type { IPCChannels } from '../shared/ipc-channels';
import { v4 as uuidv4 } from 'uuid';

export function setupIPC(): void {
  const projectRoot = process.cwd();

  ipcMain.handle('config:read', async (): Promise<IPCChannels['config:read']['result']> => {
    const result = {
      epicsDir: join(projectRoot, '_bmad-output', 'planning-artifacts'),
      storiesDir: join(projectRoot, '_bmad-output', 'implementation-artifacts'),
      storiesMode: 'flat',
      lastProjectId: null,
    };
    console.log('[IPC] config:read →', result);
    return result;
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

  ipcMain.handle('file:read', async (_event, params: IPCChannels['file:read']['params']): Promise<IPCChannels['file:read']['result']> => {
    try {
      const resolved = resolve(params.path);
      try {
        await stat(resolved);
      } catch {
        console.log(`[IPC] file:read(${params.path}) → not found`);
        return { content: '', exists: false };
      }
      const content = await readFile(resolved, 'utf-8');
      console.log(`[IPC] file:read(${params.path}) → ${content.length} chars`);
      return { content, exists: true };
    } catch (err) {
      console.error(`[IPC] file:read error for ${params.path}:`, err);
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
      console.log(`[IPC] file:readDirectory(${params.path}) → ${result.length} entries`);
      return result;
    } catch (err) {
      console.error(`[IPC] file:readDirectory error for ${params.path}:`, err);
      return [];
    }
  });
}
