import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Project, NewProject } from '../../shared/ipc-channels';
import logger from '../logger';

interface JsonData {
  version: number;
  projects: Project[];
  preferences: Record<string, string>;
}

export class JsonFallbackStorage {
  private data: JsonData;
  private filePath: string;

  readonly mode = 'json-fallback' as const;

  constructor() {
    this.filePath = join(app.getPath('userData'), 'bmad-board.json');
    this.data = this.loadData();
    logger.info('[Storage] Mode: json-fallback');
  }

  private loadData(): JsonData {
    try {
      if (!existsSync(this.filePath)) {
        return { version: 1, projects: [], preferences: {} };
      }
      const raw = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        Array.isArray(parsed.projects) &&
        typeof parsed.preferences === 'object' &&
        parsed.preferences !== null
      ) {
        const validProjects = (parsed.projects as unknown[]).filter(
          (p: unknown): p is Project =>
            typeof p === 'object' && p !== null &&
            typeof (p as Record<string, unknown>).id === 'string' &&
            typeof (p as Record<string, unknown>).name === 'string' &&
            typeof (p as Record<string, unknown>).epicsDir === 'string' &&
            typeof (p as Record<string, unknown>).storiesDir === 'string' &&
            typeof (p as Record<string, unknown>).createdAt === 'string'
        );
        const validPrefs: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed.preferences)) {
          if (typeof value === 'string') validPrefs[key] = value;
        }
        return {
          version: parsed.version ?? 1,
          projects: validProjects,
          preferences: validPrefs,
        };
      }
      logger.warn('[JSON-Fallback] Invalid data shape, resetting to defaults');
      return { version: 1, projects: [], preferences: {} };
    } catch (err) {
      logger.warn('[JSON-Fallback] Failed to read/parse data file, using defaults:', err);
      return { version: 1, projects: [], preferences: {} };
    }
  }

  private saveData(): void {
    const tmp = `${this.filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    try {
      renameSync(tmp, this.filePath);
    } catch (renameErr: unknown) {
      const code = (renameErr as NodeJS.ErrnoException).code;
      if (code === 'EPERM' || code === 'EEXIST' || code === 'EBUSY' || code === 'EACCES') {
        const bak = `${this.filePath}.bak`;
        try { renameSync(this.filePath, bak); } catch { /* ignore */ }
        try {
          renameSync(tmp, this.filePath);
          try { unlinkSync(bak); } catch { /* ignore */ }
        } catch (retryErr) {
          try { renameSync(bak, this.filePath); } catch { /* ignore */ }
          logger.error('[JSON-Fallback] Failed to save data:', retryErr);
          throw retryErr;
        }
      } else {
        throw renameErr;
      }
    }
  }

  getProjects(): Project[] {
    return [...this.data.projects].sort((a, b) => {
      const aTime = a.lastUsedAt ?? '';
      const bTime = b.lastUsedAt ?? '';
      return bTime.localeCompare(aTime);
    });
  }

  getProjectById(id: string): Project | undefined {
    return this.data.projects.find((p) => p.id === id);
  }

  addProject(project: NewProject): Project {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: uuidv4(),
      name: project.name,
      epicsDir: project.epicsDir,
      storiesDir: project.storiesDir,
      lastUsedAt: now,
      createdAt: now,
    };
    this.data.projects.push(newProject);
    this.saveData();
    return newProject;
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | undefined {
    const idx = this.data.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    const existing = this.data.projects[idx];
    const updated: Project = {
      ...existing,
      ...updates,
    };
    this.data.projects[idx] = updated;
    this.saveData();
    return updated;
  }

  removeProject(id: string): boolean {
    const idx = this.data.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.projects.splice(idx, 1);
    this.saveData();
    return true;
  }

  getPref(key: string): string | null {
    return this.data.preferences[key] ?? null;
  }

  setPref(key: string, value: string): void {
    this.data.preferences[key] = value;
    this.saveData();
  }

  getAllPrefs(): Record<string, string> {
    return { ...this.data.preferences };
  }

  close(): void {
    this.saveData();
  }
}
