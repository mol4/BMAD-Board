---
story_id: 2.2
story_key: 2-2-implement-storemanager-with-per-project-isolation
epic: 2
title: Implement StoreManager with Per-Project Isolation
status: done
baseline_commit: a75be01
previous_story: 2-1-implement-sqlite-json-fallback-storage
date: 2026-06-09T00:00:00.000Z
---

# Story 2.2: Implement StoreManager with Per-Project Isolation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want each project isolated in memory,
So that switching projects doesn't mix data.

## Acceptance Criteria

1. **Given** multiple projects are configured in SQLite  
   **When** StoreManager switches project  
   **Then** previous project's state is saved to an in-memory snapshot  
   **And** `useAppStore` is cleared via `clear()` (epics, stories, tasks, sprints, counters reset)  
   **And** new project's state is loaded into `useAppStore` from its snapshot or parsed from markdown  
   **And** `globalThis.__storeManager` persists across hot-reloads (dev only)  
   **And** no stale references to old project data remain in renderer

2. **And** StoreManager maintains `Map<string, StoreSnapshot>` with lazy load for inactive projects  
   **And** `switchProject` is debounced (300ms) to prevent concurrent rapid switches  
   **And** switching projects completes in under 2 seconds (SM-4)  
   **And** memory usage stays under 300MB with 50+ stories loaded (SM-C1)  
   **And** `unload()` clears snapshot from Map and nullifies references for garbage collection

3. **And** `StoreManager.loadProject(projectId)` reads project paths from IPC (`window.electronAPI.projectList()` or cached)  
   **And** updates `config.ts` via `setConfig({ epicsDir, storiesDir, storiesMode })`  
   **And** calls `syncMarkdownToStore()` to parse markdown from the project's directories  
   **And** sets `useAppStore.getState().setActiveProject(projectId)`  
   **And** logs the switch via `console.log` or `electron-log` in main

4. **And** `useAppStore` remains the single reactive Zustand store for UI components  
   **And** `StoreManager` never duplicates Zustand store logic (createEpic, createStory, etc.)  
   **And** `StoreManager` only handles save/restore/load/unload of plain data snapshots

5. **And** `StoreManager` class is typed in TypeScript with strict mode  
   **And** `StoreSnapshot` interface mirrors `AppState` data fields (epics, stories, tasks, sprints, counters) but NOT methods  
   **And** `StoreManager` is exported as singleton (`export const storeManager = new StoreManager()`)

6. **And** `project:switch` IPC handler in main (`src/main/ipc.ts`) stays unchanged — it already updates `last_used_at` and `lastProjectId` in storage  
   **And** `project:list` IPC handler stays unchanged — returns all projects  
   **And** no new IPC channels are added in this story

7. **And** Vitest tests cover `StoreManager` in `src/renderer/lib/store-manager.test.ts`  
   **And** tests verify: snapshot save/restore, project switch, clear, load, debounce, memory cleanup  
   **And** all existing tests (104+) continue to pass

8. **And** `npm run lint` produces zero TypeScript errors

## Tasks / Subtasks

- [x] **Task 1 — Create `src/renderer/lib/store-manager.ts`** (AC: #1, #2, #3, #4, #5)
  - [x] Define `StoreSnapshot` interface (epics, stories, tasks, sprints, counters, activeProjectId)
  - [x] Create `StoreManager` class with:
    - `private snapshots: Map<string, StoreSnapshot>`
    - `private activeProjectId: string | null`
    - `private debounceTimer: ReturnType<typeof setTimeout> | null`
    - `switchProject(projectId: string): Promise<void>` — debounced, saves current, clears store, loads new
    - `saveSnapshot(projectId: string): void` — extracts current state from `useAppStore.getState()`
    - `restoreSnapshot(projectId: string): void` — restores state into `useAppStore` via `setState`
    - `loadProject(projectId: string, project: Project): Promise<void>` — sets config, calls `syncMarkdownToStore()`, sets activeProjectId
    - `unload(projectId: string): void` — deletes snapshot from Map, nullifies references
    - `getSnapshot(projectId: string): StoreSnapshot | undefined`
    - `getActiveProjectId(): string | null`
  - [x] Export singleton: `export const storeManager = new StoreManager()`
  - [x] Attach to `globalThis.__storeManager` for hot-reload persistence
  - [x] Do NOT duplicate Zustand methods (createEpic, createStory, etc.) — StoreManager only handles data snapshots

- [x] **Task 2 — Update `src/renderer/lib/config.ts` to support per-project paths** (AC: #3)
  - [x] `loadConfigFromIPC()` stays as-is (reads global config)
  - [x] `setConfig()` stays as-is (sets global config)
  - [x] Added `lastProjectId` to `BmadConfig` for auto-load on startup
  - [x] Verify: `config.ts` singleton pattern is compatible with StoreManager switching

- [x] **Task 3 — Update `src/renderer/lib/markdown-parser.ts` if needed** (AC: #3)
  - [x] `syncMarkdownToStore()` already reads from `getConfig()` and `getEpicsPath()`/`getStoriesPath()`
  - [x] Added `resetSyncState()` export to reset `_syncInProgress` guard for re-sync after project switch
  - [x] StoreManager calls `useAppStore.getState().clear()` (sets initialized=false) then `resetSyncState()` before `syncMarkdownToStore()`

- [x] **Task 4 — Wire StoreManager into application initialization** (AC: #1, #3)
  - [x] In `src/renderer/components/Providers.tsx`, after `loadConfigFromIPC()`, check if `lastProjectId` exists
  - [x] If `lastProjectId` is set and projects exist, call `storeManager.switchProject(lastProject)` instead of plain `initializeStore()`
  - [x] On first load with no `lastProjectId`, existing flow stays (reads from default config paths)
  - [x] `WelcomePage` redirect logic unchanged (checks `useAppStore.getState().initialized && stats empty`)

- [x] **Task 5 — Write `src/renderer/lib/store-manager.test.ts`** (AC: #7)
  - [x] Test `saveSnapshot` / `restoreSnapshot` — create epic/story, save, clear, restore, verify counts
  - [x] Test `switchProject` — switch from project A to project B, verify store cleared and new data loaded
  - [x] Test `unload` — verify snapshot removed from Map
  - [x] Test debounce — rapid calls to `switchProject` only execute once
  - [x] Test `loadProject` — mock config paths, verify `syncMarkdownToStore` is called
  - [x] Test `globalThis.__storeManager` persistence
  - [x] Use `vi.mock` for markdown-parser and config modules
  - [x] Run `npm run test` — all 134 tests pass (24 new + 110 existing, 0 regressions)

- [x] **Task 6 — Verify and clean up old references** (AC: #1)
  - [x] Search codebase for `globalThis.__store` — does not exist (useAppStore is Zustand)
  - [x] No code bypasses StoreManager for project switching
  - [x] Verified `useAppStore` still has `setActiveProject` and `clear` methods

- [x] **Task 7 — Final verification** (AC: #7, #8)
  - [x] Run `npm run lint` — zero errors
  - [x] Run `npm run test` — all 134 pass
  - [x] Run `npm run dev` — n/a (desktop app, verified via tests and lint)

## Dev Notes

### Critical Context: What Already Exists

- **`useAppStore`** (`src/renderer/lib/store.ts`) is a Zustand store with all CRUD methods (createEpic, createStory, updateStoryStatus, etc.) and state fields (epics[], stories[], tasks[], sprints[], counters, loading, error, initialized, activeProjectId). It is the single reactive store for the UI. **Do NOT duplicate its logic.**
- **`syncMarkdownToStore()`** (`src/renderer/lib/markdown-parser.ts`) reads markdown from disk via IPC and populates `useAppStore`. It uses `getConfig()` to determine paths. It has `_syncInProgress` guard and `initialized` check. After project switch, you need to reset `initialized` to `false` before calling `syncMarkdownToStore()` again.
- **`config.ts`** (`src/renderer/lib/config.ts`) is a singleton holding `epicsDir`, `storiesDir`, `storiesMode`. StoreManager must call `setConfig()` with the new project's paths before `syncMarkdownToStore()`.
- **`storage.ts`** (main process) and `ipc.ts` already handle `project:list`, `project:add`, `project:remove`, `project:switch`. **No changes to main process IPC in this story.**
- **`Providers.tsx`** (`src/renderer/components/Providers.tsx`) currently calls `loadConfigFromIPC()` then `initializeStore()` on mount. This is the hook point for StoreManager.
- **`WelcomePage`** redirects from Dashboard when store is empty. After StoreManager loads a project, `initialized` must be `true` for WelcomePage to NOT redirect.

### Architecture Compliance

- **File naming:** `kebab-case.ts` for lib files (`store-manager.ts`).
- **Class naming:** `PascalCase` for classes (`StoreManager`).
- **Interface naming:** `PascalCase` (`StoreSnapshot`).
- **Zustand store remains the single reactive source.** StoreManager is a non-reactive data manager that save/restore snapshots to/from Zustand.
- **Do NOT create multiple Zustand stores.** `useAppStore` is one global store; StoreManager swaps its data.
- **Immutable updates:** StoreManager restores snapshot via `useAppStore.setState({ ...snapshot })`, not direct mutation.
- **Error handling:** If `syncMarkdownToStore()` fails, `useAppStore.setError()` should be set. StoreManager should catch and log.

### StoreManager Design Details

**Why snapshots instead of per-project Zustand stores?**
Zustand `create()` returns a global store. Creating multiple stores would require `create()` per project, which is possible but adds complexity (context providers, hook changes). Snapshots are simpler: save the current `useAppStore` data state to a plain object, clear the store, restore another snapshot.

**Snapshot shape:**
```typescript
export interface StoreSnapshot {
  epics: Epic[];
  stories: Story[];
  tasks: Task[];
  sprints: Sprint[];
  counters: { epic: number; story: number; task: number; sprint: number };
  activeProjectId: string;
  initialized: boolean;
}
```

**StoreManager methods:**
```typescript
class StoreManager {
  private snapshots = new Map<string, StoreSnapshot>();
  private activeProjectId: string | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async switchProject(projectId: string): Promise<void> {
    // Debounce
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        await this._doSwitch(projectId);
        resolve();
      }, 300);
    });
  }

  private async _doSwitch(projectId: string): Promise<void> {
    if (this.activeProjectId) {
      this.saveSnapshot(this.activeProjectId);
      this.unload(this.activeProjectId);
    }
    this.activeProjectId = projectId;
    const snapshot = this.snapshots.get(projectId);
    if (snapshot) {
      this.restoreSnapshot(snapshot);
    } else {
      // Need to load via markdown parser
      // But we need the Project object (paths). Get from IPC or pass in.
    }
  }

  saveSnapshot(projectId: string): void {
    const state = useAppStore.getState();
    this.snapshots.set(projectId, {
      epics: state.epics,
      stories: state.stories,
      tasks: state.tasks,
      sprints: state.sprints,
      counters: state.counters,
      activeProjectId: state.activeProjectId!,
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
      activeProjectId: snapshot.activeProjectId,
      initialized: snapshot.initialized,
      loading: false,
      error: null,
    });
  }

  unload(projectId: string): void {
    this.snapshots.delete(projectId);
    // Force clear if current
    if (this.activeProjectId === projectId) {
      useAppStore.getState().clear();
      this.activeProjectId = null;
    }
  }

  async loadProject(project: Project): Promise<void> {
    setConfig({
      epicsDir: project.epicsDir,
      storiesDir: project.storiesDir,
      storiesMode: project.storiesMode,
    });
    useAppStore.getState().setActiveProject(project.id);
    useAppStore.getState().setInitialized(false);
    await syncMarkdownToStore();
  }
}
```

**Important:** `loadProject` needs the `Project` object (with paths). `switchProject` can accept it as parameter, or StoreManager can cache the project list.

Simpler API:
```typescript
async switchProject(project: Project): Promise<void>
```

This is cleaner because the caller (e.g., Providers.tsx or a project switcher UI) already has the `Project` object from `project:list` or `project:switch`.

### Providers.tsx Integration

Current flow:
```typescript
useEffect(() => {
  loadConfigFromIPC().then(() => {
    initializeStore().then(() => setReady(true));
  });
}, []);
```

New flow:
```typescript
useEffect(() => {
  loadConfigFromIPC().then(async () => {
    const config = getConfig(); // or read from IPC
    const lastProjectId = ???; // need to get from IPC config:read
    const projects = await window.electronAPI.projectList();
    const lastProject = projects.find(p => p.id === lastProjectId);
    if (lastProject) {
      await storeManager.switchProject(lastProject);
    } else {
      await initializeStore(); // fallback to default paths
    }
    setReady(true);
  });
}, []);
```

But `config:read` already returns `lastProjectId`. `Providers.tsx` can call `window.electronAPI.configRead()` to get it.

Actually, `loadConfigFromIPC()` already calls `window.electronAPI.configRead()`. After it returns, `current` config has the paths. But `lastProjectId` is NOT in `BmadConfig` interface — it's in `AppConfig` (shared type) but `config.ts` doesn't store it.

Options:
1. Add `lastProjectId` to `BmadConfig` in `config.ts`
2. Call `window.electronAPI.configRead()` directly in Providers.tsx to get `lastProjectId`

Recommendation: extend `BmadConfig` to include `lastProjectId` (or `activeProjectId`). `loadConfigFromIPC()` already reads `AppConfig` from IPC. Just add the field.

### What NOT to Do (Deferred to Later Stories)

- **Project Switcher UI** → Story 2.3 (UI for selecting projects)
- **Add/Remove Project Flow** → Story 2.4 (validation, dialogs, etc.)
- **Filesystem Watcher** → Epic 3 (auto-sync when files change)
- **File Lock Mechanism** → Epic 4 (concurrent edit protection)
- **Renderer-side Zustand slice refactoring** → Not needed; StoreManager works with existing store

### Previous Story Intelligence (2.1)

- **104 tests pass** at end of Story 2.1.
- **Storage layer** is main-process only. Renderer uses `window.electronAPI` for project ops.
- **Review findings from 2.1:** Type safety is critical (`storiesMode` must be validated), error handling must not crash renderer, IPC handlers should validate inputs.
- **Retrospective lesson:** Pre-review checklist is mandatory; dev notes must be verifiable against actual file paths.
- **Common review findings:** Use `??` instead of `||` for nullish defaults; validate enum values before casts; handle edge cases in tests.

### Testing Patterns

- **Co-located tests:** `src/renderer/lib/store-manager.test.ts` for `store-manager.ts`.
- **Mocking Zustand:** Use `useAppStore.getState().clear()` in `beforeEach`.
- **Mocking IPC:** Use `vi.stubGlobal('window', { electronAPI: { projectList: vi.fn() } })`.
- **Mocking markdown-parser:** `vi.mock('@/lib/markdown-parser', () => ({ syncMarkdownToStore: vi.fn() }))`.
- **Test structure:** `describe()` per method, `it()` with descriptive names, AAA pattern.
- **Assertions:** Check `useAppStore.getState().epics.length`, `useAppStore.getState().activeProjectId`.

### Project Structure Notes

**New files to create:**
- `src/renderer/lib/store-manager.ts` — StoreManager class and StoreSnapshot interface
- `src/renderer/lib/store-manager.test.ts` — tests

**Files to update:**
- `src/renderer/lib/config.ts` — add `lastProjectId` or `activeProjectId` to `BmadConfig` and `loadConfigFromIPC()` (optional, if needed for auto-load)
- `src/renderer/components/Providers.tsx` — integrate StoreManager for initial project load
- `src/renderer/lib/markdown-parser.ts` — add `resetSyncState()` or `forceSync()` helper if needed

**No changes to:**
- `src/main/*` — IPC handlers stay unchanged
- `src/preload/*` — no new channels
- `src/shared/*` — types unchanged
- `src/renderer/lib/store.ts` — Zustand store stays unchanged
- `src/renderer/lib/store.test.ts` — no changes unless StoreManager affects it
- `tailwind.config.js`, `package.json` — no new dependencies

### References

- ADR-2: Store Architecture (Per-Project Isolation) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-2-Store-Architecture`]
- ADR-4: SQLite Usage Scope (config only) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-4-SQLite-Usage-Scope`]
- ADR-1: IPC Strategy (project channels) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-1-IPC-Strategy`]
- Architecture: StoreManager Map pattern [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-2-Store-Architecture`]
- Epic 2 Story 2.2 acceptance criteria [Source: `_bmad-output/planning-artifacts/epics.md#Story-22-Implement-StoreManager-with-Per-Project-Isolation`]
- Existing `useAppStore` baseline [Source: `src/renderer/lib/store.ts`]
- Existing `config.ts` baseline [Source: `src/renderer/lib/config.ts`]
- Existing `markdown-parser.ts` baseline [Source: `src/renderer/lib/markdown-parser.ts`]
- Existing `Providers.tsx` baseline [Source: `src/renderer/components/Providers.tsx`]
- Previous story 2.1 dev notes [Source: `_bmad-output/implementation-artifacts/2-1-implement-sqlite-json-fallback-storage.md`]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **Task 1**: Created `store-manager.ts` with `StoreSnapshot` interface, `StoreManager` class (Map-based snapshots, 300ms debounce, save/restore/load/unload), and singleton via `globalThis.__storeManager`. Uses local `ProjectRef` interface (id, epicsDir, storiesDir, storiesMode).
- **Task 2**: Added `lastProjectId: string | null` to `BmadConfig` interface and `loadConfigFromIPC()` to support auto-loading last used project on startup.
- **Task 3**: Exported `resetSyncState()` from `markdown-parser.ts` to reset `_syncInProgress` guard after project switch.
- **Task 4**: Updated `Providers.tsx` to check `config.lastProjectId` after `loadConfigFromIPC()`, fetch project list via `window.electronAPI.projectList()`, and call `storeManager.switchProject()` for auto-load or fall back to `initializeStore()`.
- **Task 5**: Created `store-manager.test.ts` with 24 tests covering: snapshot save/restore, counters, loading/error reset, unload (active/inactive), loadProject (config, sync, error handling), switchProject (save current, restore snapshot, debounce), globalThis persistence, and counters immutability.
- **Task 6**: Verified no `globalThis.__store` references, confirmed `useAppStore.clear()` and `setActiveProject()` exist.
- **Task 7**: Lint: zero errors. Tests: 134/134 pass (24 new, 110 existing, 0 regressions).

### File List

- `src/renderer/lib/store-manager.ts` — new: StoreManager class, StoreSnapshot interface, singleton export
- `src/renderer/lib/store-manager.test.ts` — new: 24 Vitest tests for StoreManager
- `src/renderer/lib/config.ts` — updated: added `lastProjectId` to `BmadConfig` and `loadConfigFromIPC()`
- `src/renderer/lib/markdown-parser.ts` — updated: exported `resetSyncState()` helper
- `src/renderer/components/Providers.tsx` — updated: integrated StoreManager for initial project auto-load

## Story Completion Status

- [x] Task 1: Create store-manager.ts
- [x] Task 2: Update config.ts if needed
- [x] Task 3: Update markdown-parser.ts if needed
- [x] Task 4: Wire StoreManager into Providers.tsx
- [x] Task 5: Write tests
- [x] Task 6: Clean up old references
- [x] Task 7: Final verification

### Review Findings

- [x] [Review][Decision] **Debounce: отменённые промисы switchProject разрешаются как успешные** — решено: (b) все промисы разрешаются после реального выполнения последнего switchProject
- [x] [Review][Decision] **Переключение на тот же проект очищает store без сохранения снапшота** — решено: (b) refresh — перечитать markdown при совпадении projectId
- [x] [Review][Decision] **Сигнатура loadProject: projectId vs ProjectRef** — решено: (a) изменить на loadProject(projectId) + внутренний IPC-запрос путей
- [x] [Review][Decision] **300ms задержка для единичного переключения** — решено: (b) оставить trailing-only (dismissed)
- [x] [Review][Decision] **lastProjectId не записывается в конфигурацию при загрузке** — решено: (a) добавить запись в loadProject в этой истории
- [x] [Review][Patch] **Debounce: все промисы должны разрешаться после реального выполнения** [store-manager.ts:78-91] — Переписать: вместо resolve() отменённых промисов, все pending resolvers ждут результат последнего _doSwitch. Убрать цикл `while (this.pendingResolvers.length > 0) { resolve() }`. Вместо этого хранить единый deferred и резолвить всех при завершении.
- [x] [Review][Patch] **Refresh при переключении на тот же проект** [store-manager.ts:93-94] — Если `activeProjectId === project.id`, не очищать store, а вызвать `loadProject(project)` для перечитки markdown (refresh).
- [x] [Review][Patch] **loadProject должен принимать projectId и читать пути из IPC** [store-manager.ts:113-131] — Изменить сигнатуру на `loadProject(projectId: string)`. Внутри вызвать `window.electronAPI.projectList()`, найти проект по id, извлечь пути. Аналогично для `switchProject(projectId: string)`.
- [x] [Review][Patch] **Запись lastProjectId в конфигурацию** [store-manager.ts:113-131] — В loadProject после успешной загрузки вызвать `setConfig({ lastProjectId: project.id })` или IPC-write для сохранения последнего проекта.
- [x] [Review][Patch] **Мутабельные ссылки в снапшотах** [store-manager.ts:47-53] — saveSnapshot хранит прямые ссылки на массивы Zustand store; getSnapshot возвращает их без клонирования. Мутация через `epic.stories.push()` в markdown-parser повреждает снапшот.
- [x] [Review][Patch] **Нет отмены in-flight _doSwitch** [store-manager.ts:93-98] — Два вызова switchProject с интервалом >300ms запускают параллельные _doSwitch. Вторая операция может clear() store во время syncMarkdownToStore первой.
- [x] [Review][Patch] **_doSwitch оставляет store пустым при ошибке** [store-manager.ts:93-101] — Если loadProject выбрасывает исключение, activeProjectId уже null, store очищен через clear(), откат невозможен.
- [x] [Review][Patch] **projectList() не проверяется на null/undefined** [Providers.tsx:22] — Если electronAPI.projectList() возвращает null/undefined, `.find()` выбросит TypeError.
- [x] [Review][Patch] **ProjectRef shape mismatch — as any маскирует проблему** [Providers.tsx:22-23] — lastProject из projectList() может не содержать epicsDir/storiesDir/storiesMode. Двойной `as any` устраняет проверку типов.
- [x] [Review][Patch] **Промежуточное невалидное состояние при переключении** [store-manager.ts:95-96] — Между clear() и restoreSnapshot/loadProject React может отрендерить пустой store с null activeProjectId.
- [x] [Review][Patch] **unload не отменяет pending debounce-таймер** [store-manager.ts:133-140] — Если unload вызван во время активного debounce, таймер срабатывает для уже выгруженного проекта.
- [x] [Review][Defer] **React Strict Mode вызывает двойной debounce** [Providers.tsx] — deferred, pre-existing (dev-only, debounce обрабатывает второй вызов)

Status: done

Ultimate context engine analysis completed - comprehensive developer guide created
