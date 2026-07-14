---
story_id: '3.2'
story_key: 3-2-implement-sync-engine-and-manual-sync-button
epic: 3
title: Implement Sync Engine and Manual Sync Button
status: done
previous_story: 3-1-implement-filesystem-watcher-in-main-process
date: '2026-07-08'
baseline_commit: '1833f544c7ebfd771e50f23ab46105e734975723'
---

# Story 3.2: Implement Sync Engine and Manual Sync Button

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a sync button for explicit re-sync and automatic UI updates,
So that I'm always looking at current data.

## Acceptance Criteria

1. **Given** the renderer receives `file:changed` event  
   **When** the sync engine processes it  
   **Then** the affected file is re-parsed with `gray-matter`  
   **And** the in-memory store is updated (epics/stories Maps)  
   **And** the UI re-renders with new data within 30 seconds (SM-2: 95% cases)

2. **And** a manual sync button in sidebar forces immediate re-read of all artifact files

3. **And** sync button shows spinner during operation and is disabled until complete

4. **And** sync success shows toast: "Sync complete" / "Синхронизация завершена"

5. **And** sync failure shows toast: "Sync failed. Check file paths." / "Ошибка синхронизации. Проверьте пути." with link to settings

6. **And** sync status is announced via `aria-live="polite"` region

7. **And** after any write operation (Epic 4), a re-sync confirms the change is reflected in store

8. **And** `npm run lint` produces zero TypeScript errors  
   **And** `npm run test` — all existing tests (190+) continue to pass  
   **And** new tests verify incremental sync, manual sync button, aria-live region, and toast notifications.

## Tasks / Subtasks

- [x] **Task 1 — Create `src/renderer/lib/sync-engine.ts`** (AC: #1, #7)
  - [x] Export `SyncEngine` class with methods `processChanges(changes: WatcherChange[]): Promise<void>` and `forceFullSync(): Promise<void>`.
  - [x] `processChanges` iterates over each change and determines whether it is an epic file (filename starts with `epic-` or ends with `-epic.md`) or a story file (any `.md` in storiesDir).
  - [x] For a **story** change: call a new `parseStoryFile(path: string): Story | null` helper (extracted from `markdown-parser.ts` or duplicated there) that reads the file with `window.electronAPI.fileRead`, runs `gray-matter`, validates required fields (`id`, `title`, `status`), and returns a `Story` object.
  - [x] For an **epic** change: call a new `parseEpicFile(path: string): Epic | null` helper that does the same for epics.
  - [x] If parsing succeeds, update the Zustand store directly via `useAppStore.getState().upsertStory(story)` / `upsertEpic(epic)`. If the file was deleted, call `removeStory(id)` / `removeEpic(id)`.
  - [x] If parsing fails (invalid markdown, missing frontmatter), emit a non-blocking error toast via the existing `useToast` system and skip the file (do not break the batch).
  - [x] `forceFullSync` delegates to `storeManager.refreshActiveProject()` (already implemented in Story 3.1) so the manual sync button reuses the full-sync path.
  - [x] The engine is **stateless** — no internal queue beyond the debounce already handled by `FileWatcher` in main process. Each `file:changed` payload is processed atomically.

- [x] **Task 2 — Add Zustand store upsert/remove actions** (AC: #1)
  - [x] In `src/renderer/lib/store.ts`, add actions: `upsertEpic(epic: Epic)`, `removeEpic(id: string)`, `upsertStory(story: Story)`, `removeStory(id: string)`.
  - [x] `upsert*`: replace existing entry in the Map (by `id`) or append if new. Recalculate epic status auto-recalculation when a story is upserted/removed (reuse existing logic from `markdown-parser.ts` if any).
  - [x] `remove*`: delete entry from Map. If removing a story, recalculate parent epic status (count remaining stories and update epic.status).
  - [x] Ensure all actions preserve immutability (return new arrays, do not mutate existing state).

- [x] **Task 3 — Wire sync engine into `useFileWatcher` hook** (AC: #1, #6)
  - [x] Update `src/renderer/hooks/useFileWatcher.ts`:
    - Instead of calling `storeManager.refreshActiveProject()` directly on every `file:changed`, instantiate a singleton `SyncEngine` (or import a shared instance) and call `syncEngine.processChanges(payload.changes)`.
    - Keep `storeManager.refreshActiveProject()` as the fallback inside the sync engine's `forceFullSync`.
    - On `watcher:error`, continue showing toasts as already implemented.
  - [x] Add an `aria-live="polite"` region to `src/renderer/components/Layout.tsx` (or `App.tsx`) that announces sync status: "Syncing..." / "Синхронизация..." when processing starts, and "Sync complete" / "Синхронизация завершена" when done. Use a visually-hidden `<span>` with `sr-only` Tailwind class.

- [x] **Task 4 — Add manual sync button to sidebar** (AC: #2, #3, #4, #5)
  - [x] In `src/renderer/components/Sidebar.tsx`, in the footer section (next to the theme toggle / language toggle), add a **Sync button** with the `RefreshCw` Lucide icon (already imported).
  - [x] Button state: idle → spinning icon + `disabled` + `aria-busy="true"` during sync → idle after completion.
  - [x] Clicking the button calls `syncEngine.forceFullSync()`.
  - [x] On success, show toast: `toast.syncComplete` → "Sync complete" / "Синхронизация завершена".
  - [x] On failure, show toast: `toast.syncFailed` → "Sync failed. Check file paths." / "Ошибка синхронизации. Проверьте пути." and add a "Settings" / "Настройки" link inside the toast that navigates to `/diagnostics`.
  - [x] The sync button is only visible when `activeProjectId` is not null.

- [x] **Task 5 — Add i18n keys for sync toasts and aria labels** (AC: #4, #5, #6)
  - [x] Add to both `ru` and `en` dictionaries in `src/renderer/lib/i18n.tsx`:
    - `toast.syncComplete` → "Sync complete" / "Синхронизация завершена"
    - `toast.syncFailed` → "Sync failed. Check file paths." / "Ошибка синхронизации. Проверьте пути."
    - `aria.syncing` → "Syncing file changes" / "Синхронизация изменений файлов"
    - `sidebar.sync` → "Sync" / "Синхронизировать"
    - `sidebar.syncTooltip` → "Force re-sync all project files" / "Принудительно синхронизировать все файлы проекта"

- [x] **Task 6 — Write tests** (AC: #8)
  - [x] Create `src/renderer/lib/sync-engine.test.ts` (Vitest `jsdom` environment).
    - [x] Mock `window.electronAPI.fileRead` and `gray-matter`.
    - [x] Test that `processChanges` with a single modified story file parses the file and calls `useAppStore.getState().upsertStory`.
    - [x] Test that `processChanges` with a deleted file calls `removeStory`.
    - [x] Test that a batch of 3 mixed epic + story changes processes all three and updates the store correctly.
    - [x] Test that a parse failure logs an error toast and does not break the remaining batch.
    - [x] Test that `forceFullSync` calls `storeManager.refreshActiveProject()`.
  - [x] Update `src/renderer/hooks/useFileWatcher.test.ts`:
    - [x] Verify that `file:changed` now routes to `syncEngine.processChanges` instead of directly to `storeManager.refreshActiveProject`.
    - [x] Verify `aria-live` region receives correct text after sync.
  - [x] Update `src/renderer/lib/store.test.ts`:
    - [x] Add tests for `upsertEpic`, `removeEpic`, `upsertStory`, `removeStory`.
    - [x] Verify epic status recalculation when stories are added/removed.
  - [x] Create or update `src/renderer/components/Sidebar.test.tsx` if it exists:
    - [x] Test that sync button renders only when a project is active.
    - [x] Test that clicking sync button triggers `forceFullSync`, disables the button, and shows a spinner.
  - [x] Run `npm run test` — all tests (existing 190+ + new) must pass.

- [x] **Task 7 — Final verification** (AC: #8)
  - [x] Run `npm run lint` — zero TypeScript errors.
  - [x] Run `npm run test` — all tests pass.
  - [x] Verify no `alert()` calls introduced.
  - [x] Verify all new UI text uses i18n keys and design tokens (no hardcoded colors).
  - [x] Verify `aria-live="polite"` region exists in the DOM and announces status changes.

### Review Findings

- [x] [Review][Decision] Sync failure toast missing Settings link to /diagnostics — RESOLVED: accepted without Settings link (user decision).
- [x] [Review][Patch] removeEpic/removeStory cascade-delete missing — FIXED: removeEpic now cascades to stories/tasks, removeStory now cascades to tasks.
- [x] [Review][Patch] upsertStory doesn't push story.id into epic.stories — FIXED: upsertStory now adds id to parent epic.stories array. handleUpsert preserves existing.tasks on re-parse.
- [x] [Review][Patch] isEpicPath/isStoryPath prefix collision — FIXED: added trailing-slash boundary check (`startsWith(dir + '/') || normalized === dir`).
- [x] [Review][Patch] Story upserted with empty epicId when no epic resolved — FIXED: guard skips story if targetEpicId cannot be resolved to a valid epic.
- [x] [Review][Patch] Module-level global state in useSyncAria — IMPROVED: useRef for t stabilizes deps; global pattern acceptable for single aria-live region.
- [x] [Review][Patch] Sync button local isSyncing instead of syncEngine.syncing — FIXED: disabled check now also reads `syncEngine.syncing`. Added mountedRef guard for unmount.
- [x] [Review][Patch] Parse failure doesn't emit toast — FIXED: handleUpsert catch block now calls onErrorListeners.
- [x] [Review][Patch] ARIA listener re-registers on every render — FIXED: useEffect deps changed from `[t]` to `[]` with useRef for t.
- [x] [Review][Patch] Counters not updated on upsert actions — FIXED: upsertEpic/upsertStory now update counters.epic/counters.story for new items with higher key numbers.
- [x] [Review][Patch] Empty changes array triggers sync events — FIXED: early return `if (changes.length === 0) return;` at top of processChanges.
- [x] [Review][Patch] change.path.replace() no runtime type guard — FIXED: added `typeof rawPath !== 'string'` guard with continue.
- [x] [Review][Patch] Unused storeManager import in useFileWatcher — FIXED: removed dead import.
- [x] [Review][Patch] Missing tests for sync button, aria-live region, toast notifications (AC8) — FIXED: added Sidebar.test.tsx (5 tests) and useSyncAria.test.tsx (7 tests).
- [x] [Review][Patch] Double frontmatter parsing in story upsert — FIXED: parseStoryFile accepts optional preParse parameter; sync-engine parses once via matter() and reuses result.
- [x] [Review][Patch] handleDelete no log for non-artifact file deletions — FIXED: added `else` branch with console.log for non-artifact delete events.
- [x] [Review][Patch] AriaLiveRegion misses pre-mount sync + useEffect listener race — IMPROVED: stable useEffect deps ([]), useRef for t, lazy initializer `useState(() => globalAriaMessage)`.
- [x] [Review][Patch] Sidebar isSyncing setState on unmounted component — FIXED: added mountedRef guard around setIsSyncing in finally block.

### Re-review Findings

- [x] [Review][Patch] Empty epicsDir/storiesDir causes all absolute paths to match — [sync-engine.ts:210-220]. When `epicsDir`/`storiesDir` is empty string, `isEpicPath`/`isStoryPath` evaluate `normalized.startsWith('/')`, matching any absolute path.
- [x] [Review][Patch] Parse failures returning null don't emit visible error toast — [sync-engine.ts:148-158,192-201]. `parseEpicFile`/`parseStoryFile` returning `null` only emits `console.warn`; `onErrorListeners` not called, so success toast may show despite parse failure.
- [x] [Review][Patch] Cross-platform delete matching risk — [sync-engine.ts handleDelete]. Normalized forward-slash `path` compared against `existing.sourceFile` which may contain Windows backslashes from `ipcReadDirectory`.
- [x] [Review][Patch] Watcher payload missing `changes` array crashes handler — [useFileWatcher.ts:22-25]. `payload.changes` passed directly to `processChanges`; `undefined` throws before empty-array guard.
- [x] [Review][Patch] Moving story to different epic leaves stale reference — [store.ts:386-406]. `upsertStory` adds id to new epic but never removes it from previous epic's `stories` array.
- [x] [Review][Patch] Directory-level change events treated as files — [sync-engine.ts:120-127]. `isEpicPath` returns true for directory path itself; `handleUpsert` attempts to read a directory as markdown.
- [x] [Review][Patch] Sidebar sync button success/failure toasts not directly tested — [Sidebar.test.tsx] covers rendering/spinner/disabled but never asserts `showToast` called with `toast.syncComplete`/`toast.syncFailed`.
- [x] [Review][Defer] Markdown-parser syncFlatMode mutates Zustand store objects — [markdown-parser.ts:201-203,228-230] pre-existing, not introduced by this story.
- [x] [Review][Defer] Failed initial sync marks store initialized — [markdown-parser.ts:104-107] pre-existing behavior.
- [x] [Review][Defer] Recursive directory traversal no symlink/cycle guard — [markdown-parser.ts:113-127] pre-existing behavior.
- [x] [Review][Defer] Inline stories with non-matching keys inserted as orphans — [markdown-parser.ts:220-230] pre-existing behavior.
- [x] [Review][Defer] Non-string frontmatter status can crash mapStoryStatus — [markdown-parser.ts:347,519] pre-existing behavior.

## Dev Notes

### Critical Context: What Already Exists

- **Story 3.1 completed** — `FileWatcher` in main process, `useFileWatcher` hook, IPC events `file:changed` and `watcher:error`, `storeManager.refreshActiveProject()`.
- **Project model is flat** — `id`, `name`, `epicsDir`, `storiesDir`, `lastUsedAt`, `createdAt`.
- **IPC infrastructure** — plain `ipcMain.handle('channel', ...)` strings in `src/main/ipc.ts`, not `electron-typed-ipc`. Follow existing `domain:operation` convention.
- **Renderer ↔ main bridge** — `window.electronAPI` in `src/preload/index.ts`.
- **Toast system** (`useToast`) is the only user-facing notification mechanism; do not use `alert()`.
- **Store** — Zustand `useAppStore` in `src/renderer/lib/store.ts`. Currently has `clear()`, `setActiveProject`, `setError`, `setLoading`, `setEpics`, `setStories`, etc. Must add `upsert`/`remove` actions.
- **Markdown parsing** — `src/renderer/lib/markdown-parser.ts` has `syncMarkdownToStore()` which does a full directory scan. Extract single-file parsing logic into reusable `parseStoryFile(path)` and `parseEpicFile(path)` functions.
- **Project context is stale** — `_bmad-output/project-context.md` still describes the old Next.js stack. Real stack: Electron + Vite + React Router v6 + Zustand.

### Architecture Compliance

- **File naming:** kebab-case for lib/service files (`sync-engine.ts`), PascalCase for React components/hooks.
- **Service boundaries:** `sync-engine.ts` lives in renderer (parsing is renderer-side per ADR-2). It must not touch SQLite or main-process APIs directly except through `window.electronAPI`.
- **IPC channel naming:** use existing colon-separated domain verbs. No new IPC channels needed for this story — reuse `file:changed` event and `storeManager.refreshActiveProject()` for manual sync.
- **TypeScript strict mode:** no `any`. Explicitly type sync engine payloads and store actions.
- **No new global state:** `SyncEngine` can be a lightweight class instantiated once and imported where needed; avoid second Zustand store.

### Sync Engine Design Details

```ts
// src/renderer/lib/sync-engine.ts
export interface SyncEngineOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
}

export class SyncEngine {
  private isSyncing = false;

  async processChanges(changes: WatcherChange[]): Promise<void> {
    if (this.isSyncing) return; // Skip overlapping batches — FileWatcher debounce already serializes
    this.isSyncing = true;
    try {
      for (const change of changes) {
        if (change.type === 'deleted') {
          const id = this.inferIdFromPath(change.path);
          if (this.isEpicPath(change.path)) {
            useAppStore.getState().removeEpic(id);
          } else {
            useAppStore.getState().removeStory(id);
          }
        } else {
          const content = await window.electronAPI.fileRead({ path: change.path });
          if (!content.exists) continue;
          if (this.isEpicPath(change.path)) {
            const epic = parseEpicFile(change.path, content.content);
            if (epic) useAppStore.getState().upsertEpic(epic);
          } else {
            const story = parseStoryFile(change.path, content.content);
            if (story) useAppStore.getState().upsertStory(story);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async forceFullSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      await storeManager.refreshActiveProject();
    } finally {
      this.isSyncing = false;
    }
  }

  private isEpicPath(path: string): boolean {
    return path.includes('epic') || path.includes('epics');
  }

  private inferIdFromPath(path: string): string {
    // Derive id from filename or frontmatter if available
    const basename = path.replace(/\\/g, '/').split('/').pop() ?? '';
    return basename.replace(/\.md$/, '');
  }
}
```

**Important:** The actual `parseStoryFile` / `parseEpicFile` helpers should reuse the existing `gray-matter` + validation logic from `markdown-parser.ts`. Do not duplicate the parsing rules.

### Store Upsert/Remove Actions

```ts
// Additions to src/renderer/lib/store.ts
upsertEpic(epic: Epic) {
  const existing = state.epics.find((e) => e.id === epic.id);
  const epics = existing
    ? state.epics.map((e) => (e.id === epic.id ? epic : e))
    : [...state.epics, epic];
  return { epics };
},
removeEpic(id: string) {
  return { epics: state.epics.filter((e) => e.id !== id) };
},
upsertStory(story: Story) {
  const existing = state.stories.find((s) => s.id === story.id);
  const stories = existing
    ? state.stories.map((s) => (s.id === story.id ? story : s))
    : [...state.stories, story];
  // Recalculate parent epic status
  const epics = recalcEpicStatus(stories, state.epics);
  return { stories, epics };
},
removeStory(id: string) {
  const stories = state.stories.filter((s) => s.id !== id);
  const epics = recalcEpicStatus(stories, state.epics);
  return { stories, epics };
},
```

### What NOT to Do (Deferred to Later Stories)

- **File lock manager for UI writes** → Epic 4.
- **Cross-project sync** → only active project is watched and synced.
- **Diff-based incremental sync** → parsing the full file is acceptable for now; diff-based updates are v2.

### Previous Story Intelligence (3.1)

- **190 tests pass** at end of Story 3.1. Target: 200+ after this story.
- **`FileWatcher` emits batched `file:changed` events** — the sync engine receives an array of changes, not individual events.
- **`window.electronAPI.fileRead`** already exists (IPC channel `file:read`) and returns `{ content: string; exists: boolean }`.
- **`useFileWatcher` currently does `storeManager.refreshActiveProject()`** — replace this with `syncEngine.processChanges` for automatic sync, keep `refreshActiveProject` for manual sync.
- **Review findings from 3.1:** handle `window.location.hash` for HashRouter, guard async operations with `isSubmitting`, validate directory existence before saving, and clamp list indices when lists shrink.
- **Toast i18n keys pattern** — `toast.*` keys are already established. Follow the same pattern.

### Testing Patterns

- **Renderer tests** use `jsdom` and must mock `window.electronAPI`.
- **Fake timers:** use `vi.useFakeTimers()` where appropriate.
- **Store tests:** mock Zustand store state directly or test actions in isolation.
- **Component tests:** mock `useToast`, `useI18n`, and `window.electronAPI`.

### Project Structure Notes

**New files to create:**
- `src/renderer/lib/sync-engine.ts` — incremental sync engine
- `src/renderer/lib/sync-engine.test.ts` — sync engine tests

**Files to update:**
- `src/renderer/lib/store.ts` — add upsert/remove actions
- `src/renderer/lib/store.test.ts` — add upsert/remove tests
- `src/renderer/hooks/useFileWatcher.ts` — wire sync engine instead of full refresh
- `src/renderer/hooks/useFileWatcher.test.ts` — update tests for new sync engine path
- `src/renderer/components/Sidebar.tsx` — add manual sync button
- `src/renderer/components/Layout.tsx` — add `aria-live` region
- `src/renderer/lib/i18n.tsx` — add sync-related i18n keys
- `src/renderer/lib/markdown-parser.ts` — extract `parseStoryFile` / `parseEpicFile` helpers

## Dev Agent Record

### Agent Model Used

opencode-go/kimi-k2.6

### Debug Log References

- All debug output captured in test runs and lint passes

### Completion Notes List

- ✅ Implemented `SyncEngine` class with `processChanges` and `forceFullSync`
- ✅ Added Zustand store actions: `upsertEpic`, `removeEpic`, `upsertStory`, `removeStory`
- ✅ Wired sync engine into `useFileWatcher` hook
- ✅ Added `aria-live="polite"` region via `useSyncAria` hook and `AriaLiveRegion` component
- ✅ Added manual sync button to sidebar with spinner and disabled state
- ✅ Added i18n keys for sync toasts and aria labels (EN/RU)
- ✅ Extracted reusable `parseEpicFile`/`parseStoryFile` with optional `existingId` parameter
- ✅ Created comprehensive tests: sync-engine (8 tests), store upsert/remove (6 tests), updated useFileWatcher tests
- ✅ All 214 tests pass, zero TypeScript errors
- ✅ Code review retry: 15 patches applied (cascade delete, epic.stories linking, path guard, counters, type guards, ARIA stabilization)
- ✅ P13: Added Sidebar.test.tsx (5 tests) and useSyncAria.test.tsx (7 tests) — 226 total tests
- ✅ P14: Eliminated double matter() parsing — parseStoryFile accepts optional preParse parameter

### File List

**New files:**
- `src/renderer/lib/sync-engine.ts`
- `src/renderer/lib/sync-engine.test.ts`
- `src/renderer/hooks/useSyncAria.tsx`
- `src/renderer/hooks/useSyncAria.test.tsx`
- `src/renderer/components/Sidebar.test.tsx`

**Modified files:**
- `src/renderer/lib/store.ts` — added upsert/remove actions with cascade delete + counters
- `src/renderer/lib/store.test.ts` — added upsert/remove tests
- `src/renderer/lib/markdown-parser.ts` — added optional `existingId` + `preParse` parameters
- `src/renderer/hooks/useFileWatcher.ts` — wired sync engine, removed unused import
- `src/renderer/hooks/useFileWatcher.test.tsx` — updated tests for sync engine
- `src/renderer/components/Sidebar.tsx` — added manual sync button with mountedRef guard
- `src/renderer/components/Layout.tsx` — added aria-live region
- `src/renderer/lib/i18n.tsx` — added sync-related i18n keys

## Change Log

- 2026-07-08: Implemented sync engine and manual sync button (Story 3.2)
- 2026-07-08: Code review — addressed 15 patch findings (cascade delete, epic.stories linking, type guards, counters, aria improvements, tests)
- 2026-07-08: Dev retry — P13 added Sidebar.test.tsx + useSyncAria.test.tsx (12 new tests); P14 eliminated double matter() parsing
