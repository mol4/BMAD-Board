import matter from 'gray-matter';
import type { Story, Epic, StoryStatus, EpicStatus } from '@/lib/types';
import { syncEngine } from '@/lib/sync-engine';

export interface WriteResult {
  ok: true;
  mtimeMs: number;
}

export interface WriteError {
  ok: false;
  code: 'FILE_LOCKED' | 'FILE_CHANGED' | 'FILE_WRITE_ERROR';
  message: string;
}

export type WriteOutcome = WriteResult | WriteError;

export interface FileWriteIPCParams {
  path: string;
  content: string;
  lastMtimeMs?: number;
}

const mtimeCache = new Map<string, number>();

async function ipcFileWrite(params: FileWriteIPCParams): Promise<{ mtimeMs: number }> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('electronAPI not available');
  }
  return window.electronAPI.fileWrite(params);
}

function getCurrentMtimeMs(story: Story): number | undefined {
  return mtimeCache.get(story.sourceFile ?? story.id);
}

function setCurrentMtimeMs(story: Story, mtimeMs: number): void {
  const key = story.sourceFile ?? story.id;
  mtimeCache.set(key, mtimeMs);
}

export async function writeStoryStatus(
  story: Story,
  newStatus: StoryStatus,
): Promise<WriteOutcome> {
  const sourceFile = story.sourceFile;
  if (!sourceFile) {
    return { ok: false, code: 'FILE_WRITE_ERROR', message: 'Story has no source file' };
  }

  let rawMarkdown = story.rawMarkdown;
  if (!rawMarkdown && typeof window !== 'undefined' && window.electronAPI) {
    // NOTE: This reads from disk without acquiring a lock. The read is safe
    // because it only fetches content for the UI to prepare a write; the actual
    // write path (ipcFileWrite) acquires the lock before persisting.
    const result = await window.electronAPI.fileRead(sourceFile);
    if (result.exists) {
      rawMarkdown = result.content;
    }
  }

  if (!rawMarkdown) {
    return { ok: false, code: 'FILE_WRITE_ERROR', message: 'Cannot read source file' };
  }

  return writeStatusToMarkdown(sourceFile, rawMarkdown, newStatus, getCurrentMtimeMs(story), (mtimeMs) => {
    setCurrentMtimeMs(story, mtimeMs);
  });
}

export async function writeEpicStatus(
  epic: Epic,
  newStatus: EpicStatus,
): Promise<WriteOutcome> {
  const sourceFile = epic.sourceFile;
  if (!sourceFile) {
    return { ok: false, code: 'FILE_WRITE_ERROR', message: 'Epic has no source file' };
  }

  let rawMarkdown = epic.rawMarkdown;
  if (!rawMarkdown && typeof window !== 'undefined' && window.electronAPI) {
    const result = await window.electronAPI.fileRead(sourceFile);
    if (result.exists) {
      rawMarkdown = result.content;
    }
  }

  if (!rawMarkdown) {
    return { ok: false, code: 'FILE_WRITE_ERROR', message: 'Cannot read source file' };
  }

  return writeStatusToMarkdown(sourceFile, rawMarkdown, newStatus, undefined, undefined);
}

async function writeStatusToMarkdown(
  filePath: string,
  rawMarkdown: string,
  newStatus: string,
  lastMtimeMs: number | undefined,
  onSuccess?: (mtimeMs: number) => void,
): Promise<WriteOutcome> {
  try {
    const parsed = matter(rawMarkdown);
    parsed.data.status = newStatus;

    if (parsed.data.updatedAt !== undefined) {
      parsed.data.updatedAt = new Date().toISOString();
    }

    const newContent = matter.stringify(parsed.content, parsed.data);

    const validation = matter(newContent);
    if (validation.data.status !== newStatus) {
      return { ok: false, code: 'FILE_WRITE_ERROR', message: 'Frontmatter validation failed after write' };
    }

    const result = await ipcFileWrite({
      path: filePath,
      content: newContent,
      lastMtimeMs,
    });

    if (onSuccess) {
      onSuccess(result.mtimeMs);
    }

    try {
      await syncEngine.forceFullSync();
    } catch (syncErr) {
      console.warn('[file-writer] Sync after write failed:', syncErr);
    }

    return { ok: true, mtimeMs: result.mtimeMs };
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    const code = (e.code === 'FILE_LOCKED' || e.code === 'FILE_CHANGED' || e.code === 'FILE_WRITE_ERROR')
      ? e.code
      : 'FILE_WRITE_ERROR';
    return { ok: false, code, message: e.message || 'Unknown write error' };
  }
}
