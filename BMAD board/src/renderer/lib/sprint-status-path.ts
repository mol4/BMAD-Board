import { getConfig } from './config';

export function resolveSprintStatusPath(): string | null {
  const { storiesDir } = getConfig();

  if (!storiesDir || !storiesDir.trim()) {
    console.warn('[sprint-status-path] storiesDir is not configured');
    return null;
  }

  return `${storiesDir.trim()}/sprint-status.yaml`;
}
