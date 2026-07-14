import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StoreManager } from '@/lib/store-manager';
import type { StoreSnapshot } from '@/lib/store-manager';
import { useAppStore } from '@/lib/store';

interface TestProject {
  id: string;
  name: string;
  epicsDir: string;
  storiesDir: string;
  lastUsedAt: string | null;
  createdAt: string;
}

vi.mock('@/lib/markdown-parser', () => ({
  syncMarkdownToStore: vi.fn().mockResolvedValue({ epics: 3, stories: 7 }),
  resetSyncState: vi.fn(),
  initializeStore: vi.fn(),
}));

vi.mock('@/lib/config', () => {
  const current: Record<string, unknown> = { epicsDir: '', storiesDir: '', lastProjectId: null };
  return {
    setConfig: vi.fn((partial: Record<string, unknown>) => { Object.assign(current, partial); }),
    getConfig: vi.fn(() => ({ ...current })),
    loadConfigFromIPC: vi.fn().mockResolvedValue(undefined),
    getEpicsPath: vi.fn(() => current.epicsDir),
    getStoriesPath: vi.fn(() => current.storiesDir),
  };
});

function makeProject(overrides: Partial<TestProject> = {}): TestProject {
  return {
    id: 'proj-1',
    name: 'Test Project',
    epicsDir: '_bmad-output/planning-artifacts',
    storiesDir: '_bmad-output/implementation-artifacts',
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const projectRegistry = new Map<string, TestProject>();

function setupElectronAPI() {
  (globalThis as Record<string, unknown>).window = {
    electronAPI: {
      projectList: vi.fn().mockImplementation(async () => Array.from(projectRegistry.values())),
      projectSwitch: vi.fn().mockResolvedValue(undefined),
      watcherWatch: vi.fn().mockResolvedValue(undefined),
      watcherStop: vi.fn().mockResolvedValue(undefined),
      watcherStatus: vi.fn().mockResolvedValue({ active: true, dirs: [], fallback: false, pendingCount: 0 }),
    },
  };
}

function registerProject(project: TestProject) {
  projectRegistry.set(project.id, project);
}

describe('StoreSnapshot interface', () => {
  it('should have the correct shape fields', () => {
    const snapshot: StoreSnapshot = {
      epics: [],
      stories: [],
      tasks: [],
      sprints: [],
      counters: { epic: 0, story: 0, task: 0, sprint: 0 },
      activeProjectId: '',
      initialized: false,
    };
    expect(snapshot.epics).toEqual([]);
    expect(snapshot.counters.epic).toBe(0);
    expect(snapshot.initialized).toBe(false);
  });
});

describe('StoreManager', () => {
  describe('watcher integration', () => {
    it('loadProject starts the file watcher with project dirs', async () => {
      const project = makeProject({
        id: 'proj-watch',
        epicsDir: '/custom/epics',
        storiesDir: '/custom/stories',
      });
      registerProject(project);
      const manager = new StoreManager();

      await manager.loadProject('proj-watch');

      const api = (globalThis as Record<string, unknown>).window as {
        electronAPI: { watcherWatch: ReturnType<typeof vi.fn> };
      };
      expect(api.electronAPI.watcherWatch).toHaveBeenCalledWith(['/custom/epics', '/custom/stories']);
    });

    it('refreshActiveProject is a no-op when no active project', async () => {
      const manager = new StoreManager();
      await expect(manager.refreshActiveProject()).resolves.toBeUndefined();
    });

    it('refreshActiveProject reloads the active project', async () => {
      const project = makeProject({ id: 'proj-refresh-2' });
      registerProject(project);
      const manager = new StoreManager();
      await manager.loadProject('proj-refresh-2');

      const { syncMarkdownToStore } = await import('@/lib/markdown-parser');
      (syncMarkdownToStore as ReturnType<typeof vi.fn>).mockClear();

      await manager.refreshActiveProject();

      expect(syncMarkdownToStore).toHaveBeenCalled();
      expect(manager.getActiveProjectId()).toBe('proj-refresh-2');
    });

    it('unload stops the file watcher when unloading active project', async () => {
      const project = makeProject({ id: 'proj-unload' });
      registerProject(project);
      const manager = new StoreManager();
      await manager.loadProject('proj-unload');

      const api = (globalThis as Record<string, unknown>).window as {
        electronAPI: { watcherStop: ReturnType<typeof vi.fn> };
      };
      api.electronAPI.watcherStop.mockClear();

      manager.unload('proj-unload');

      expect(api.electronAPI.watcherStop).toHaveBeenCalled();
    });

    it('unload does not stop the watcher when unloading an inactive project', async () => {
      const project = makeProject({ id: 'proj-other' });
      registerProject(project);
      const manager = new StoreManager();
      await manager.loadProject('proj-other');

      const api = (globalThis as Record<string, unknown>).window as {
        electronAPI: { watcherStop: ReturnType<typeof vi.fn> };
      };
      api.electronAPI.watcherStop.mockClear();

      manager.unload('proj-not-active');

      expect(api.electronAPI.watcherStop).not.toHaveBeenCalled();
    });
  });
  let manager: StoreManager;

  beforeEach(() => {
    useAppStore.getState().clear();
    useAppStore.setState({ activeProjectId: null, loading: false, error: null });
    manager = new StoreManager();
    projectRegistry.clear();
    setupElectronAPI();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as Record<string, unknown>).window;
  });

  describe('saveSnapshot', () => {
    it('should save current store state into snapshot Map', () => {
      useAppStore.getState().createEpic({ title: 'Epic A', description: 'desc' });
      useAppStore.getState().setActiveProject('proj-1');

      manager.saveSnapshot('proj-1');

      const snap = manager.getSnapshot('proj-1');
      expect(snap).toBeDefined();
      expect(snap!.epics.length).toBe(1);
      expect(snap!.epics[0].title).toBe('Epic A');
      expect(snap!.activeProjectId).toBe('proj-1');
    });

    it('should overwrite existing snapshot for the same project', () => {
      useAppStore.getState().createEpic({ title: 'Epic A', description: 'desc' });
      manager.saveSnapshot('proj-1');

      useAppStore.getState().createEpic({ title: 'Epic B', description: 'desc' });
      manager.saveSnapshot('proj-1');

      const snap = manager.getSnapshot('proj-1');
      expect(snap!.epics.length).toBe(2);
    });
  });

  describe('restoreSnapshot', () => {
    it('should populate the store from a snapshot', () => {
      useAppStore.getState().createEpic({ title: 'Epic A', description: 'desc' });
      useAppStore.getState().setActiveProject('proj-1');
      manager.saveSnapshot('proj-1');

      useAppStore.getState().clear();
      manager.restoreSnapshot(manager.getSnapshot('proj-1')!);

      expect(useAppStore.getState().epics.length).toBe(1);
      expect(useAppStore.getState().epics[0].title).toBe('Epic A');
      expect(useAppStore.getState().activeProjectId).toBe('proj-1');
    });

    it('should restore counters correctly', () => {
      useAppStore.getState().createEpic({ title: 'Epic A', description: 'desc' });
      useAppStore.getState().createEpic({ title: 'Epic B', description: 'desc' });
      useAppStore.getState().createStory({ epicId: '', title: 'Story 1', description: 'desc' });
      manager.saveSnapshot('proj-1');

      useAppStore.getState().clear();
      manager.restoreSnapshot(manager.getSnapshot('proj-1')!);

      expect(useAppStore.getState().counters.epic).toBe(2);
      expect(useAppStore.getState().counters.story).toBe(1);
    });

    it('should clear loading and error state on restore', () => {
      useAppStore.setState({ loading: true, error: 'some error' });
      useAppStore.getState().setActiveProject('proj-1');
      manager.saveSnapshot('proj-1');

      useAppStore.getState().clear();
      manager.restoreSnapshot(manager.getSnapshot('proj-1')!);

      expect(useAppStore.getState().loading).toBe(false);
      expect(useAppStore.getState().error).toBeNull();
    });

    it('should handle null activeProjectId in snapshot', () => {
      const snapshot: StoreSnapshot = {
        epics: [],
        stories: [],
        tasks: [],
        sprints: [],
        counters: { epic: 0, story: 0, task: 0, sprint: 0 },
        activeProjectId: '',
        initialized: true,
      };
      manager.restoreSnapshot(snapshot);
      expect(useAppStore.getState().activeProjectId).toBeNull();
    });
  });

  describe('unload', () => {
    it('should remove snapshot from Map', () => {
      manager.saveSnapshot('proj-1');
      expect(manager.getSnapshot('proj-1')).toBeDefined();

      manager.unload('proj-1');
      expect(manager.getSnapshot('proj-1')).toBeUndefined();
    });

    it('should clear the store when unloading active project', () => {
      useAppStore.getState().createEpic({ title: 'Epic', description: 'desc' });
      useAppStore.getState().setActiveProject('proj-1');
      manager.saveSnapshot('proj-1');
      const snap = manager.getSnapshot('proj-1')!;
      manager.restoreSnapshot(snap);

      manager.unload('proj-1');

      expect(useAppStore.getState().epics.length).toBe(0);
      expect(manager.getActiveProjectId()).toBeNull();
    });

    it('should not affect store when unloading inactive project', () => {
      useAppStore.getState().createEpic({ title: 'Epic', description: 'desc' });
      manager.saveSnapshot('proj-2');

      manager.unload('proj-2');

      expect(useAppStore.getState().epics.length).toBe(1);
    });
  });

  describe('getActiveProjectId', () => {
    it('should return null initially', () => {
      expect(manager.getActiveProjectId()).toBeNull();
    });

    it('should return active project after loadProject', async () => {
      const project = makeProject({ id: 'proj-active' });
      registerProject(project);
      await manager.loadProject('proj-active');
      expect(manager.getActiveProjectId()).toBe('proj-active');
    });
  });

  describe('getSnapshot', () => {
    it('should return undefined for unknown project', () => {
      expect(manager.getSnapshot('unknown')).toBeUndefined();
    });

    it('should return saved snapshot', () => {
      manager.saveSnapshot('proj-1');
      expect(manager.getSnapshot('proj-1')).toBeDefined();
    });
  });

  describe('loadProject', () => {
    it('should set config from resolved project fields', async () => {
      const { setConfig } = await import('@/lib/config');
      const project = makeProject({
        id: 'proj-2',
        epicsDir: '/custom/epics',
        storiesDir: '/custom/stories',
      });
      registerProject(project);

      await manager.loadProject('proj-2');

      expect(setConfig).toHaveBeenCalledWith({
        epicsDir: '/custom/epics',
        storiesDir: '/custom/stories',
      });
    });

    it('should clear store and sync markdown', async () => {
      const { syncMarkdownToStore } = await import('@/lib/markdown-parser');
      useAppStore.getState().createEpic({ title: 'Old Epic', description: 'desc' });
      const project = makeProject();
      registerProject(project);

      await manager.loadProject('proj-1');

      expect(useAppStore.getState().epics.length).toBe(0);
      expect(syncMarkdownToStore).toHaveBeenCalled();
    });

    it('should set activeProjectId after loading', async () => {
      const project = makeProject({ id: 'proj-3' });
      registerProject(project);

      await manager.loadProject('proj-3');

      expect(manager.getActiveProjectId()).toBe('proj-3');
      expect(useAppStore.getState().activeProjectId).toBe('proj-3');
    });

    it('should handle sync failure gracefully', async () => {
      const { syncMarkdownToStore } = await import('@/lib/markdown-parser');
      (syncMarkdownToStore as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Sync failed'));
      const project = makeProject();
      registerProject(project);

      await expect(manager.loadProject('proj-1')).rejects.toThrow('Sync failed');
      expect(useAppStore.getState().error).toBe('Error: Sync failed');
    });

    it('should write lastProjectId to config', async () => {
      const { setConfig } = await import('@/lib/config');
      const project = makeProject({ id: 'proj-last' });
      registerProject(project);

      await manager.loadProject('proj-last');

      expect(setConfig).toHaveBeenCalledWith(expect.objectContaining({ lastProjectId: 'proj-last' }));
    });

    it('should throw when project not found in IPC', async () => {
      await expect(manager.loadProject('nonexistent')).rejects.toThrow('Project nonexistent not found');
    });
  });

  describe('switchProject', () => {
    it('should save snapshot of current project before switching', async () => {
      const projectA = makeProject({ id: 'proj-A' });
      const projectB = makeProject({ id: 'proj-B' });
      registerProject(projectA);
      registerProject(projectB);

      await manager.loadProject('proj-A');
      useAppStore.getState().createEpic({ title: 'Epic in A', description: 'desc' });

      await manager.switchProject('proj-B');

      const snap = manager.getSnapshot('proj-A');
      expect(snap).toBeDefined();
      expect(snap!.epics.length).toBe(1);
    });

    it('should restore snapshot if previously saved', async () => {
      const projectA = makeProject({ id: 'proj-A' });
      const projectB = makeProject({ id: 'proj-B' });
      registerProject(projectA);
      registerProject(projectB);

      await manager.loadProject('proj-A');
      useAppStore.getState().createEpic({ title: 'Epic A', description: 'desc' });

      await manager.switchProject('proj-B');

      expect(useAppStore.getState().epics.length).toBe(0);
      expect(manager.getActiveProjectId()).toBe('proj-B');

      await manager.switchProject('proj-A');

      expect(useAppStore.getState().epics.length).toBe(1);
      expect(useAppStore.getState().epics[0].title).toBe('Epic A');
      expect(manager.getActiveProjectId()).toBe('proj-A');
    });

    it('should debounce rapid switches (only last project loaded)', async () => {
      const projectA = makeProject({ id: 'proj-A' });
      const projectB = makeProject({ id: 'proj-B' });
      const projectC = makeProject({ id: 'proj-C' });
      registerProject(projectA);
      registerProject(projectB);
      registerProject(projectC);

      const { syncMarkdownToStore } = await import('@/lib/markdown-parser');
      (syncMarkdownToStore as ReturnType<typeof vi.fn>).mockClear();

      const p1 = manager.switchProject('proj-A');
      const p2 = manager.switchProject('proj-B');
      const p3 = manager.switchProject('proj-C');

      await Promise.all([p1, p2, p3]);

      expect(syncMarkdownToStore).toHaveBeenCalledTimes(1);
      expect(manager.getActiveProjectId()).toBe('proj-C');
    });

    it('should resolve all debounced promises after execution', async () => {
      const projectA = makeProject({ id: 'proj-A' });
      const projectB = makeProject({ id: 'proj-B' });
      registerProject(projectA);
      registerProject(projectB);

      let aResolved = false;
      let bResolved = false;

      const pA = manager.switchProject('proj-A').then(() => { aResolved = true; });
      const pB = manager.switchProject('proj-B').then(() => { bResolved = true; });

      await Promise.all([pA, pB]);

      expect(aResolved).toBe(true);
      expect(bResolved).toBe(true);
    });

    it('should refresh when switching to the same project', async () => {
      const project = makeProject({ id: 'proj-refresh' });
      registerProject(project);

      await manager.loadProject('proj-refresh');
      useAppStore.getState().createEpic({ title: 'Epic', description: 'desc' });

      const { syncMarkdownToStore } = await import('@/lib/markdown-parser');
      (syncMarkdownToStore as ReturnType<typeof vi.fn>).mockClear();

      await manager.switchProject('proj-refresh');

      expect(syncMarkdownToStore).toHaveBeenCalled();
    });

    it('should rollback to previous project on load failure', async () => {
      const projectA = makeProject({ id: 'proj-A' });
      const projectB = makeProject({ id: 'proj-B' });
      registerProject(projectA);
      registerProject(projectB);

      await manager.loadProject('proj-A');
      useAppStore.getState().createEpic({ title: 'Epic in A', description: 'desc' });

      const { syncMarkdownToStore } = await import('@/lib/markdown-parser');
      (syncMarkdownToStore as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Sync failed'));

      await expect(manager.switchProject('proj-B')).rejects.toThrow('Sync failed');

      expect(useAppStore.getState().epics.length).toBe(1);
      expect(useAppStore.getState().epics[0].title).toBe('Epic in A');
      expect(manager.getActiveProjectId()).toBe('proj-A');
    });
  });

  describe('globalThis.__storeManager persistence', () => {
    it('should be attached to globalThis', () => {
      expect((globalThis as Record<string, unknown>).__storeManager).toBeDefined();
    });

    it('should be singleton across the module', async () => {
      const mod = await import('@/lib/store-manager');
      expect(mod.storeManager).toBeDefined();
      expect(mod.storeManager).toBe(mod.storeManager);
    });
  });

  describe('snapshot immutability', () => {
    it('should not mutate stored counters when snapshot copy is modified', () => {
      useAppStore.getState().setActiveProject('proj-1');
      manager.saveSnapshot('proj-1');
      const snap = manager.getSnapshot('proj-1')!;

      snap.counters.epic = 999;

      const snap2 = manager.getSnapshot('proj-1')!;
      expect(snap2.counters.epic).toBe(0);
    });

    it('should not mutate stored arrays when snapshot copy is modified', () => {
      useAppStore.getState().createEpic({ title: 'Epic A', description: 'desc' });
      useAppStore.getState().setActiveProject('proj-1');
      manager.saveSnapshot('proj-1');
      const snap = manager.getSnapshot('proj-1')!;

      snap.epics.push({} as never);

      const snap2 = manager.getSnapshot('proj-1')!;
      expect(snap2.epics.length).toBe(1);
    });

    it('should not be affected by subsequent store mutations', () => {
      useAppStore.getState().createEpic({ title: 'Epic A', description: 'desc' });
      useAppStore.getState().setActiveProject('proj-1');
      manager.saveSnapshot('proj-1');

      useAppStore.getState().createEpic({ title: 'Epic B', description: 'desc' });

      const snap = manager.getSnapshot('proj-1')!;
      expect(snap.epics.length).toBe(1);
    });
  });
});
