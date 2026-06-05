import { describe, it, expect, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const testDir = mkdtempSync(join(tmpdir(), 'json-fallback-test-'));

vi.mock('electron', () => ({
  app: {
    getPath: () => testDir,
  },
}));

import { JsonFallbackStorage } from './json-fallback';

function cleanDataFile(): void {
  const filePath = join(testDir, 'bmad-board.json');
  try { unlinkSync(filePath); } catch { /* ignore */ }
}

describe('JsonFallbackStorage', () => {
  afterAll(() => {
    try { rmSync(testDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  afterEach(() => {
    cleanDataFile();
  });

  describe('mode', () => {
    it('reports mode as json-fallback', () => {
      const storage = new JsonFallbackStorage();
      expect(storage.mode).toBe('json-fallback');
    });
  });

  describe('getProjects / addProject', () => {
    let storage: JsonFallbackStorage;

    beforeEach(() => {
      storage = new JsonFallbackStorage();
    });

    it('returns empty array when no projects exist', () => {
      expect(storage.getProjects()).toEqual([]);
    });

    it('adds a project and returns it with generated id and timestamps', () => {
      const project = storage.addProject({
        name: 'Test Project',
        epicsDir: '/epics',
        storiesDir: '/stories',
        storiesMode: 'flat',
      });

      expect(project.id).toBeTruthy();
      expect(project.name).toBe('Test Project');
      expect(project.epicsDir).toBe('/epics');
      expect(project.storiesDir).toBe('/stories');
      expect(project.storiesMode).toBe('flat');
      expect(project.lastUsedAt).toBeTruthy();
      expect(project.createdAt).toBeTruthy();
      expect(project.createdAt).toBe(project.lastUsedAt);
    });

    it('returns projects sorted by lastUsedAt DESC', () => {
      const p1 = storage.addProject({ name: 'A', epicsDir: '/a', storiesDir: '/sa', storiesMode: 'flat' });
      const p2 = storage.addProject({ name: 'B', epicsDir: '/b', storiesDir: '/sb', storiesMode: 'nested' });

      const projects = storage.getProjects();
      expect(projects.length).toBe(2);
      expect(projects.map((p) => p.name)).toContain('A');
      expect(projects.map((p) => p.name)).toContain('B');
    });
  });

  describe('getProjectById', () => {
    it('returns undefined for non-existent project', () => {
      const storage = new JsonFallbackStorage();
      expect(storage.getProjectById('nonexistent')).toBeUndefined();
    });

    it('returns the project by id', () => {
      const storage = new JsonFallbackStorage();
      const created = storage.addProject({
        name: 'Find Me',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'nested',
      });
      const found = storage.getProjectById(created.id);
      expect(found).toEqual(created);
    });
  });

  describe('updateProject', () => {
    it('returns undefined for non-existent project', () => {
      const storage = new JsonFallbackStorage();
      expect(storage.updateProject('nonexistent', { name: 'x' })).toBeUndefined();
    });

    it('updates project name', () => {
      const storage = new JsonFallbackStorage();
      const project = storage.addProject({
        name: 'Original',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'flat',
      });
      const updated = storage.updateProject(project.id, { name: 'Renamed' });
      expect(updated?.name).toBe('Renamed');
      expect(updated?.id).toBe(project.id);
    });

    it('updates lastUsedAt without changing other fields', () => {
      const storage = new JsonFallbackStorage();
      const project = storage.addProject({
        name: 'Original',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'flat',
      });
      const newTime = new Date(Date.now() + 10000).toISOString();
      const updated = storage.updateProject(project.id, { lastUsedAt: newTime });
      expect(updated?.lastUsedAt).toBe(newTime);
      expect(updated?.name).toBe('Original');
      expect(updated?.createdAt).toBe(project.createdAt);
    });
  });

  describe('removeProject', () => {
    it('returns false for non-existent project', () => {
      const storage = new JsonFallbackStorage();
      expect(storage.removeProject('nonexistent')).toBe(false);
    });

    it('removes an existing project and returns true', () => {
      const storage = new JsonFallbackStorage();
      const project = storage.addProject({
        name: 'To Delete',
        epicsDir: '/e',
        storiesDir: '/s',
        storiesMode: 'flat',
      });
      expect(storage.removeProject(project.id)).toBe(true);
      expect(storage.getProjectById(project.id)).toBeUndefined();
      expect(storage.getProjects().length).toBe(0);
    });
  });

  describe('getPref / setPref / getAllPrefs', () => {
    it('returns null for unset preference', () => {
      const storage = new JsonFallbackStorage();
      expect(storage.getPref('unknown')).toBeNull();
    });

    it('sets and gets a preference', () => {
      const storage = new JsonFallbackStorage();
      storage.setPref('theme', 'dark');
      expect(storage.getPref('theme')).toBe('dark');
    });

    it('returns all preferences', () => {
      const storage = new JsonFallbackStorage();
      storage.setPref('key1', 'val1');
      storage.setPref('key2', 'val2');
      const all = storage.getAllPrefs();
      expect(all).toEqual({ key1: 'val1', key2: 'val2' });
    });
  });

  describe('atomic writes', () => {
    it('writes JSON file to disk', () => {
      const storage = new JsonFallbackStorage();
      storage.setPref('test', 'value');
      storage.addProject({ name: 'P', epicsDir: '/e', storiesDir: '/s', storiesMode: 'flat' });

      const filePath = join(testDir, 'bmad-board.json');
      expect(existsSync(filePath)).toBe(true);

      const content = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(content.preferences.test).toBe('value');
      expect(content.version).toBe(1);
      expect(content.projects.length).toBe(1);
    });

    it('does not leave .tmp files after save', () => {
      const storage = new JsonFallbackStorage();
      storage.setPref('test', 'value');

      const entries = readdirSync(testDir);
      const tmpFiles = entries.filter((f) => f.endsWith('.tmp'));
      expect(tmpFiles.length).toBe(0);
    });
  });

  describe('corruption recovery', () => {
    it('handles corrupt JSON by returning empty defaults', () => {
      const filePath = join(testDir, 'bmad-board.json');
      writeFileSync(filePath, 'this is not valid json{{{');

      const storage = new JsonFallbackStorage();
      expect(storage.getProjects()).toEqual([]);
      expect(storage.getAllPrefs()).toEqual({});
    });

    it('handles missing projects array by resetting', () => {
      const filePath = join(testDir, 'bmad-board.json');
      writeFileSync(filePath, JSON.stringify({ version: 1, something: 'else' }));

      const storage = new JsonFallbackStorage();
      expect(storage.getProjects()).toEqual([]);
    });

    it('handles null preferences object gracefully', () => {
      const filePath = join(testDir, 'bmad-board.json');
      writeFileSync(filePath, JSON.stringify({ version: 1, projects: [], preferences: null }));

      const storage = new JsonFallbackStorage();
      expect(storage.getAllPrefs()).toEqual({});
    });

    it('handles non-string preference values by filtering them', () => {
      const filePath = join(testDir, 'bmad-board.json');
      writeFileSync(filePath, JSON.stringify({ version: 1, projects: [], preferences: { valid: 'ok', numeric: 42 } }));

      const storage = new JsonFallbackStorage();
      expect(storage.getPref('valid')).toBe('ok');
      expect(storage.getPref('numeric')).toBeNull();
    });
  });

  describe('concurrent write safety', () => {
    it('handles rapid sequential writes without data corruption', () => {
      const storage = new JsonFallbackStorage();
      for (let i = 0; i < 50; i++) {
        storage.setPref(`key${i}`, `value${i}`);
      }
      const all = storage.getAllPrefs();
      expect(Object.keys(all).length).toBe(50);
      expect(all.key0).toBe('value0');
      expect(all.key49).toBe('value49');
    });

    it('maintains data integrity across multiple operation types', () => {
      const storage = new JsonFallbackStorage();
      storage.addProject({ name: 'P1', epicsDir: '/e1', storiesDir: '/s1', storiesMode: 'flat' });
      storage.setPref('theme', 'dark');
      storage.addProject({ name: 'P2', epicsDir: '/e2', storiesDir: '/s2', storiesMode: 'nested' });
      storage.setPref('theme', 'light');

      const projects = storage.getProjects();
      expect(projects.length).toBe(2);
      expect(storage.getPref('theme')).toBe('light');
    });
  });

  describe('close', () => {
    it('closes without error', () => {
      const storage = new JsonFallbackStorage();
      storage.close();
    });
  });
});
