import fs from 'fs';
import path from 'path';

export interface BmadConfig {
  /** Path to epics directory (absolute or relative to project root) */
  epicsDir: string;
  /** Path to stories directory (absolute or relative to project root) */
  storiesDir: string;
  /** 'nested' = stories in epic subdirs (default), 'flat' = all stories in one folder */
  storiesMode: 'nested' | 'flat';
}

const ROOT = process.cwd();

function resolve(p: string): string {
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function pickFirstExistingPath(candidates: string[], fallback: string): string {
  for (const candidate of candidates) {
    if (fs.existsSync(resolve(candidate))) {
      return candidate;
    }
  }
  return fallback;
}

const defaultEpicsDir = pickFirstExistingPath(
  [
    '../_bmad-output/planning-artifacts',
  ],
  '../_bmad-output/planning-artifacts'
);

const defaultStoriesDir = pickFirstExistingPath(
  [
    '../_bmad-output/implementation-artifacts',
  ],
  '../_bmad-output/implementation-artifacts'
);

const defaults: BmadConfig = {
  epicsDir: defaultEpicsDir,
  storiesDir: defaultStoriesDir,
  storiesMode: defaultStoriesDir.includes('implementation-artifacts') ? 'flat' : 'nested',
};

let current: BmadConfig = { ...defaults };

export function getConfig(): BmadConfig {
  return { ...current };
}

export function setConfig(partial: Partial<BmadConfig>): BmadConfig {
  current = { ...current, ...partial };
  return getConfig();
}

export function resetConfig(): BmadConfig {
  current = { ...defaults };
  return getConfig();
}

/** Resolved absolute path to epics directory */
export function getEpicsPath(): string {
  return resolve(current.epicsDir);
}

/** Resolved absolute path to stories directory */
export function getStoriesPath(): string {
  return resolve(current.storiesDir);
}