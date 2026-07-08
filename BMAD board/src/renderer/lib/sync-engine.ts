import matter from 'gray-matter';
import { useAppStore } from '@/lib/store';
import { storeManager } from '@/lib/store-manager';
import { getConfig } from '@/lib/config';
import { parseEpicFile, parseStoryFile } from '@/lib/markdown-parser';
import type { WatcherChange } from '../../shared/ipc-channels';
import type { Epic, Story } from '@/lib/types';

type SyncListener = () => void;
type SyncErrorListener = (err: Error) => void;

export class SyncEngine {
  private isSyncing = false;
  private onStartListeners: SyncListener[] = [];
  private onCompleteListeners: SyncListener[] = [];
  private onErrorListeners: SyncErrorListener[] = [];

  get syncing(): boolean {
    return this.isSyncing;
  }

  addEventListener(event: 'start' | 'complete', listener: SyncListener): () => void {
    const list = event === 'start' ? this.onStartListeners : this.onCompleteListeners;
    list.push(listener);
    return () => {
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  addErrorListener(listener: SyncErrorListener): () => void {
    this.onErrorListeners.push(listener);
    return () => {
      const idx = this.onErrorListeners.indexOf(listener);
      if (idx >= 0) this.onErrorListeners.splice(idx, 1);
    };
  }

  async processChanges(changes: WatcherChange[]): Promise<void> {
    if (changes.length === 0) return;
    if (this.isSyncing) {
      console.log('[SyncEngine] Sync already in progress, skipping batch');
      return;
    }
    this.isSyncing = true;
    this.onStartListeners.forEach((fn) => fn());

    try {
      const config = getConfig();
      const epicsDir = config.epicsDir;
      const storiesDir = config.storiesDir;

      for (const change of changes) {
        const rawPath = change.path;
        if (typeof rawPath !== 'string') {
          console.warn('[SyncEngine] Invalid path in change, skipping');
          continue;
        }
        const normalizedPath = rawPath.replace(/\\/g, '/');

        if (change.type === 'deleted') {
          await this.handleDelete(normalizedPath, epicsDir, storiesDir);
        } else {
          await this.handleUpsert(normalizedPath, epicsDir, storiesDir);
        }
      }

      this.onCompleteListeners.forEach((fn) => fn());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[SyncEngine] Batch sync failed:', error);
      this.onErrorListeners.forEach((fn) => fn(error));
    } finally {
      this.isSyncing = false;
    }
  }

  async forceFullSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncEngine] Full sync already in progress, skipping');
      return;
    }
    this.isSyncing = true;
    this.onStartListeners.forEach((fn) => fn());

    try {
      await storeManager.refreshActiveProject();
      this.onCompleteListeners.forEach((fn) => fn());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[SyncEngine] Full sync failed:', error);
      this.onErrorListeners.forEach((fn) => fn(error));
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async handleDelete(path: string, epicsDir: string, storiesDir: string): Promise<void> {
    const isEpic = this.isEpicPath(path, epicsDir);
    const isStory = this.isStoryPath(path, storiesDir);

    if (isEpic) {
      const existing = useAppStore.getState().epics.find((e) => e.sourceFile?.replace(/\\/g, '/') === path);
      if (existing) {
        useAppStore.getState().removeEpic(existing.id);
        console.log(`[SyncEngine] Deleted epic ${existing.key}`);
      }
    } else if (isStory) {
      const existing = useAppStore.getState().stories.find((s) => s.sourceFile?.replace(/\\/g, '/') === path);
      if (existing) {
        useAppStore.getState().removeStory(existing.id);
        console.log(`[SyncEngine] Deleted story ${existing.key}`);
      }
    } else {
      console.log(`[SyncEngine] Skipping non-artifact delete: ${path}`);
    }
  }

  private async handleUpsert(path: string, epicsDir: string, storiesDir: string): Promise<void> {
    const isEpic = this.isEpicPath(path, epicsDir);
    const isStory = this.isStoryPath(path, storiesDir);

    if (!isEpic && !isStory) {
      console.log(`[SyncEngine] Skipping non-artifact file: ${path}`);
      return;
    }

    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        console.warn('[SyncEngine] electronAPI not available');
        return;
      }

      const result = await window.electronAPI.fileRead(path);
      if (!result.exists) {
        console.warn(`[SyncEngine] File not found: ${path}`);
        return;
      }

      if (isEpic) {
        const existing = useAppStore.getState().epics.find((e) => e.sourceFile === path);
        const existingId = existing?.id;
        const fallbackNum = existing
          ? parseInt(existing.key.replace('EPIC-', ''), 10) || 1
          : useAppStore.getState().counters.epic + 1;

        const epic = parseEpicFile(result.content, path, fallbackNum, existingId);
        if (epic) {
          // Preserve existing stories array if updating
          if (existing) {
            epic.stories = existing.stories;
          }
          useAppStore.getState().upsertEpic(epic);
          console.log(`[SyncEngine] Upserted epic ${epic.key}`);
        } else {
          const error = new Error(`Failed to parse epic file: ${path}`);
          console.warn(`[SyncEngine] ${error.message}`);
          this.onErrorListeners.forEach((fn) => fn(error));
        }
      }

      if (isStory) {
        const existing = useAppStore.getState().stories.find((s) => s.sourceFile === path);
        const existingId = existing?.id;
        const fallbackNum = existing
          ? parseFloat(existing.key.replace('STORY-', '')) || 1
          : useAppStore.getState().counters.story + 1;

        // Parse frontmatter once; reuse in parseStoryFile
        const parsed = matter(result.content);
        const allEpics = useAppStore.getState().getAllEpics();
        let targetEpicId = allEpics[0]?.id ?? '';

        const epicKey = parsed.data?.epicId || parsed.data?.epic_key || parsed.data?.epic;
        if (epicKey) {
          const epicKeyStr = String(epicKey).startsWith('EPIC-') ? String(epicKey) : `EPIC-${epicKey}`;
          const epic = useAppStore.getState().getEpicByKey(epicKeyStr);
          if (epic) targetEpicId = epic.id;
        } else {
          const filenameEpicMatch = path.replace(/^.*[\\\/]/, '').match(/^(\d+)-/);
          if (filenameEpicMatch) {
            const epicNum = parseInt(filenameEpicMatch[1], 10);
            const epic = useAppStore.getState().getEpicByKey(`EPIC-${epicNum}`);
            if (epic) targetEpicId = epic.id;
          }
        }

        if (!targetEpicId) {
          console.warn(`[SyncEngine] Cannot resolve epic for story: ${path}`);
          return;
        }

        const story = parseStoryFile(result.content, targetEpicId, path, fallbackNum, existingId, parsed);
        if (story) {
          if (existing) {
            story.tasks = existing.tasks;
          }
          useAppStore.getState().upsertStory(story);
          console.log(`[SyncEngine] Upserted story ${story.key}`);
        } else {
          const error = new Error(`Failed to parse story file: ${path}`);
          console.warn(`[SyncEngine] ${error.message}`);
          this.onErrorListeners.forEach((fn) => fn(error));
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[SyncEngine] Error processing ${path}:`, error);
      this.onErrorListeners.forEach((fn) => fn(error));
    }
  }

  private isEpicPath(path: string, epicsDir: string): boolean {
    if (!epicsDir) return false;
    if (path.endsWith('/') || path.endsWith('\\')) return false;
    const normalized = path.replace(/\\/g, '/');
    const dir = epicsDir.replace(/\\/g, '/').replace(/\/$/, '');
    return normalized.startsWith(dir + '/') || normalized === dir;
  }

  private isStoryPath(path: string, storiesDir: string): boolean {
    if (!storiesDir) return false;
    if (path.endsWith('/') || path.endsWith('\\')) return false;
    const normalized = path.replace(/\\/g, '/');
    const dir = storiesDir.replace(/\\/g, '/').replace(/\/$/, '');
    return normalized.startsWith(dir + '/') || normalized === dir;
  }
}

export const syncEngine = new SyncEngine();
