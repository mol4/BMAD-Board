import { resolveSprintStatusPath } from './sprint-status-path';
import type { StoryStatus } from '@/lib/types';

const STATUS_MAP: Record<StoryStatus, string> = {
  backlog: 'backlog',
  todo: 'ready-for-dev',
  'in-progress': 'in-progress',
  'in-review': 'review',
  done: 'done',
};

const mtimeCache = new Map<string, number>();

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function ipcFileRead(path: string): Promise<{ content: string; exists: boolean }> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('electronAPI not available');
  }
  return window.electronAPI.fileRead(path);
}

function ipcFileWrite(path: string, content: string, lastMtimeMs?: number): Promise<{ mtimeMs: number }> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('electronAPI not available');
  }
  return window.electronAPI.fileWrite({ path, content, lastMtimeMs });
}

function mapStatus(uiStatus: StoryStatus): string {
  return STATUS_MAP[uiStatus] ?? uiStatus;
}

function replaceStatusLine(lines: string[], idx: number, key: string, indent: number, newStatus: string): void {
  const trimmed = lines[idx].trimStart();
  const afterKey = trimmed.slice(key.length + 1).trim();
  const commentMatch = afterKey.match(/^(\S+)(\s+#.*)?$/);
  const comment = commentMatch?.[2] || '';
  lines[idx] = `${' '.repeat(indent)}${key}: ${newStatus}${comment}`;
}

function updateStatusLine(content: string, storyKey: string, newStatus: string): string | null {
  const lines = content.split('\n');

  // Exact match: "storyKey: status"
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith(`${storyKey}:`)) {
      const indent = lines[i].length - trimmed.length;
      replaceStatusLine(lines, i, storyKey, indent, newStatus);
      return lines.join('\n');
    }
  }

  // Prefix match (for inline stories where storyKey is like "4-2-"):
  // find any line "X-Y-...: status" starting with this prefix
  if (/^\d+-\w+-/.test(storyKey)) {
    const prefix = storyKey;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      const match = trimmed.match(/^(\S+):\s*\S+/);
      if (match && match[1].startsWith(prefix)) {
        const fullKey = match[1];
        const indent = lines[i].length - trimmed.length;
        replaceStatusLine(lines, i, fullKey, indent, newStatus);
        return lines.join('\n');
      }
    }
  }

  return null;
}

function updateLastUpdated(content: string): string {
  const today = getCurrentDate();
  const lines = content.split('\n');
  const lastUpdatedPattern = /^(\s*last_updated:\s*).*$/;

  for (let i = 0; i < lines.length; i++) {
    if (lastUpdatedPattern.test(lines[i])) {
      lines[i] = lines[i].replace(lastUpdatedPattern, `$1${today}`);
      break;
    }
  }

  return lines.join('\n');
}

export async function updateSprintStatus(
  storyKey: string,
  newStatus: StoryStatus,
): Promise<boolean> {
  try {
    const sprintPath = resolveSprintStatusPath();
    if (!sprintPath) {
      console.warn('[sprint-status-sync] Could not resolve sprint-status.yaml path');
      return false;
    }

    const readResult = await ipcFileRead(sprintPath);

    if (!readResult.exists) {
      console.warn('[sprint-status-sync] sprint-status.yaml not found at', sprintPath);
      return false;
    }

    const mappedStatus = mapStatus(newStatus);

    let updatedContent = updateStatusLine(readResult.content, storyKey, mappedStatus);
    if (updatedContent === null) {
      console.warn(`[sprint-status-sync] Story key "${storyKey}" not found in sprint-status.yaml`);
      return false;
    }

    updatedContent = updateLastUpdated(updatedContent);

    const lastMtimeMs = mtimeCache.get(sprintPath);

    const writeResult = await ipcFileWrite(sprintPath, updatedContent, lastMtimeMs);
    mtimeCache.set(sprintPath, writeResult.mtimeMs);

    return true;
  } catch (err) {
    console.warn('[sprint-status-sync] Failed to update sprint-status.yaml:', err);
    return false;
  }
}
