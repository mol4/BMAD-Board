import { SqliteStorage } from './sqlite-storage';
import { JsonFallbackStorage } from './json-fallback';
import logger from '../logger';
import type { Project, NewProject } from '../../shared/ipc-channels';

export type StorageMode = 'sqlite' | 'json-fallback';

let _instance: SqliteStorage | JsonFallbackStorage | null = null;

function getInstance(): SqliteStorage | JsonFallbackStorage {
  if (_instance) return _instance;

  try {
    _instance = new SqliteStorage();
  } catch (err) {
    logger.warn('[Storage] SQLite init failed, falling back to JSON:', err);
    _instance = new JsonFallbackStorage();
  }

  return _instance;
}

export function getStorageMode(): StorageMode {
  return getInstance().mode;
}

export function getProjects(): Project[] {
  return getInstance().getProjects();
}

export function getProjectById(id: string): Project | undefined {
  return getInstance().getProjectById(id);
}

export function addProject(project: NewProject): Project {
  return getInstance().addProject(project);
}

export function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | undefined {
  return getInstance().updateProject(id, updates);
}

export function removeProject(id: string): boolean {
  return getInstance().removeProject(id);
}

export function getPref(key: string): string | null {
  return getInstance().getPref(key);
}

export function setPref(key: string, value: string): void {
  getInstance().setPref(key, value);
}

export function getAllPrefs(): Record<string, string> {
  return getInstance().getAllPrefs();
}

export function closeStorage(): void {
  if (_instance) {
    try { _instance.close(); } finally { _instance = null; }
  }
}
