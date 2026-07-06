import type { Epic, Story, Task, Sprint } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { setConfig } from '@/lib/config';
import { syncMarkdownToStore, resetSyncState } from '@/lib/markdown-parser';

export interface StoreSnapshot {
  epics: Epic[];
  stories: Story[];
  tasks: Task[];
  sprints: Sprint[];
  counters: { epic: number; story: number; task: number; sprint: number };
  activeProjectId: string;
  initialized: boolean;
}

interface ProjectRef {
  id: string;
  epicsDir: string;
  storiesDir: string;
}

interface PendingPromise {
  resolve: () => void;
  reject: (err: unknown) => void;
}

export class StoreManager {
  private snapshots = new Map<string, StoreSnapshot>();
  private activeProjectId: string | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPromises: PendingPromise[] = [];
  private switchGeneration = 0;

  getActiveProjectId(): string | null {
    return this.activeProjectId;
  }

  getSnapshot(projectId: string): StoreSnapshot | undefined {
    const snap = this.snapshots.get(projectId);
    if (!snap) return undefined;
    return {
      epics: [...snap.epics],
      stories: [...snap.stories],
      tasks: [...snap.tasks],
      sprints: [...snap.sprints],
      counters: { ...snap.counters },
      activeProjectId: snap.activeProjectId,
      initialized: snap.initialized,
    };
  }

  saveSnapshot(projectId: string): void {
    const state = useAppStore.getState();
    this.snapshots.set(projectId, {
      epics: [...state.epics],
      stories: [...state.stories],
      tasks: [...state.tasks],
      sprints: [...state.sprints],
      counters: { ...state.counters },
      activeProjectId: state.activeProjectId ?? '',
      initialized: state.initialized,
    });
  }

  restoreSnapshot(snapshot: StoreSnapshot): void {
    useAppStore.setState({
      epics: snapshot.epics,
      stories: snapshot.stories,
      tasks: snapshot.tasks,
      sprints: snapshot.sprints,
      counters: snapshot.counters,
      activeProjectId: snapshot.activeProjectId || null,
      initialized: snapshot.initialized,
      loading: false,
      error: null,
    });
    this.activeProjectId = snapshot.activeProjectId || null;
  }

  async switchProject(projectId: string): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    return new Promise<void>((resolve, reject) => {
      this.pendingPromises.push({ resolve, reject });
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        const promises = [...this.pendingPromises];
        this.pendingPromises = [];
        this.switchGeneration++;
        const gen = this.switchGeneration;
        this._doSwitch(projectId, gen)
          .then(() => promises.forEach((p) => p.resolve()))
          .catch((err) => promises.forEach((p) => p.reject(err)));
      }, 300);
    });
  }

  private async _doSwitch(projectId: string, generation: number): Promise<void> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.projectSwitch({ projectId });
      } catch (err) {
        console.error('[StoreManager] Failed to update project switch metadata:', err);
      }
    }

    if (this.activeProjectId === projectId) {
      if (this.switchGeneration !== generation) return;
      await this.loadProject(projectId);
      console.log(`[StoreManager] Refreshed project ${projectId} from markdown`);
      return;
    }

    const previousProjectId = this.activeProjectId;
    if (previousProjectId) {
      this.saveSnapshot(previousProjectId);
    }

    useAppStore.getState().clear();

    if (this.switchGeneration !== generation) return;

    const snapshot = this.snapshots.get(projectId);
    if (snapshot) {
      this.restoreSnapshot(snapshot);
      console.log(`[StoreManager] Restored snapshot for project ${projectId}`);
    } else {
      try {
        if (this.switchGeneration !== generation) return;
        await this.loadProject(projectId);
        console.log(`[StoreManager] Loaded project ${projectId} from markdown`);
      } catch (err) {
        if (previousProjectId) {
          const rollbackSnap = this.snapshots.get(previousProjectId);
          if (rollbackSnap) {
            this.restoreSnapshot(rollbackSnap);
            console.log(`[StoreManager] Rolled back to project ${previousProjectId}`);
          }
        }
        throw err;
      }
    }
  }

  async loadProject(projectId: string): Promise<void> {
    const project = await this.resolveProject(projectId);

    setConfig({
      epicsDir: project.epicsDir,
      storiesDir: project.storiesDir,
    });

    resetSyncState();
    useAppStore.getState().clear();
    useAppStore.getState().setActiveProject(projectId);

    try {
      await syncMarkdownToStore();
    } catch (err) {
      console.error('[StoreManager] Failed to sync project:', err);
      useAppStore.getState().setError(String(err));
      throw err;
    }

    setConfig({ lastProjectId: projectId });
    this.activeProjectId = projectId;

    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.watcherWatch([project.epicsDir, project.storiesDir]);
      } catch (err) {
        console.error('[StoreManager] Failed to start file watcher:', err);
      }
    }

    console.log(`[StoreManager] Project ${projectId} loaded and synced`);
  }

  async refreshActiveProject(): Promise<void> {
    const activeProjectId = this.activeProjectId;
    if (!activeProjectId) return;
    const currentGeneration = this.switchGeneration;
    try {
      await this.loadProject(activeProjectId);
      if (this.switchGeneration !== currentGeneration) {
        console.log(`[StoreManager] Refresh cancelled — project switched during refresh`);
        return;
      }
      console.log(`[StoreManager] Refreshed active project ${activeProjectId}`);
    } catch (err) {
      console.error('[StoreManager] Failed to refresh active project:', err);
      throw err;
    }
  }

  private async resolveProject(projectId: string): Promise<ProjectRef> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('electronAPI not available');
    }
    const projects = await window.electronAPI.projectList();
    if (!projects || !Array.isArray(projects)) {
      throw new Error('projectList returned invalid data');
    }
    const project = projects.find((p: { id: string }) => p.id === projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    return {
      id: project.id,
      epicsDir: project.epicsDir,
      storiesDir: project.storiesDir,
    };
  }

  unload(projectId: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      const promises = [...this.pendingPromises];
      this.pendingPromises = [];
      promises.forEach((p) => p.resolve());
    }
    if (this.activeProjectId === projectId) {
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.watcherStop().catch((err) => {
          console.error('[StoreManager] Failed to stop file watcher on unload:', err);
        });
      }
      useAppStore.getState().clear();
      this.activeProjectId = null;
    }
    this.snapshots.delete(projectId);
  }
}

const globalKey = '__storeManager' as const;

if (!(globalThis as Record<string, unknown>)[globalKey]) {
  (globalThis as Record<string, unknown>)[globalKey] = new StoreManager();
}

export const storeManager: StoreManager = (globalThis as Record<string, unknown>)[globalKey] as StoreManager;
