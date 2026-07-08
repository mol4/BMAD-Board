---
story_id: '4.1'
story_key: 4-1-implement-file-lock-status-update-and-read-only-document-view
epic: 4
title: Implement File Lock, Status Update, and Read-Only Document View
status: done
previous_story: 3-2-implement-sync-engine-and-manual-sync-button
date: '2026-07-08'
baseline_commit: '7d864e7b61ca4a4592499a6a50fd2f72acb7e7de'
---

# Story 4.1: Implement File Lock, Status Update, and Read-Only Document View

Status: done

## Story

As a user,
I want the app to read markdown files and allow status changes without conflicting with AI agents,
So that I can track progress while AI agents manage the documents.

## Acceptance Criteria

1. **Given** a markdown file exists on disk  
   **When** the app loads the project  
   **Then** all epics, stories, and documents are parsed from markdown and displayed in UI  
   **And** the app is read-first: no create or delete operations are available anywhere in the UI

2. **Given** the user views a document or story markdown  
   **When** the content renders  
   **Then** frontmatter structure is preserved  
   **And** no inline editing controls are shown (read-only for this story)

3. **Given** a story status update is triggered  
   **When** the UI prepares to write  
   **Then** the UI acquires an explicit file lock, writes the new status to frontmatter, and releases the lock immediately  
   **And** lock owner is tracked (`'ui'` or `'agent'`)

4. **Given** a file lock is held by an agent  
   **When** the UI attempts to write  
   **Then** the write is aborted  
   **And** a toast shows: "File is being edited by AI agent. Please wait." / "Файл редактируется AI-агентом. Пожалуйста, подождите."

5. **Given** a lock owner crashes or fails to release  
   **When** 30 seconds elapse since lock creation  
   **Then** the lock is considered stale and may be overridden by a new UI write

6. **Given** the UI is about to write a status update  
   **When** the file mtime on disk differs from the mtime last seen by the app  
   **Then** the write is rejected  
   **And** a toast shows: "File changed by another process. Refresh and try again." / "Файл изменён другим процессом. Обновите и попробуйте снова."

7. **Given** the UI writes a status update  
   **When** the write executes  
   **Then** it uses an atomic pattern: write to a temp file → rename (never overwrite directly)  
   **And** the markdown file remains valid (frontmatter + body preserved)

8. **Given** a status update write succeeds  
   **When** the write completes  
   **Then** the app re-syncs the affected file into the store  
   **And** the UI reflects the new status within 30 seconds

9. **Given** frontmatter validation fails during write  
   **When** the write is attempted  
   **Then** the operation rolls back (temp file discarded)  
   **And** a destructive toast shows the error without corrupting the original file

10. **Given** the user visits any surface (Dashboard, Backlog, Epics, Stories, Docs)  
    **When** they look for create/delete actions  
    **Then** no Create Epic, Create Story, Create Task, or Delete buttons or menu items are present

11. **Given** the user is on the Backlog or Board page  
    **When** they want to change a story status  
    **Then** a select dropdown allows changing status among: `backlog`, `todo`, `in-progress`, `in-review`, `done`

12. **Given** the implementation is complete  
    **When** `npm run lint` runs  
    **Then** zero TypeScript errors are produced  
    **And** `npm run test` — all existing tests (226+) continue to pass  
    **And** new tests verify file lock behavior, status write atomicity, mtime conflict rejection, and read-only UI removal.

## Tasks / Subtasks

- [x] **Task 1 — Implement file lock manager in main process** (AC: #3, #4, #5)
  - [x] Create `src/main/services/file-lock.ts` exporting `FileLockManager`.
  - [x] Use disk-based sidecar lock files stored outside watched artifact dirs (e.g., app user-data directory) so external AI processes can participate.
  - [x] Lock file shape: `{ owner: 'ui' | 'agent', timestamp: number }`.
  - [x] Methods: `acquire(filePath, owner)`, `release(filePath)`, `getStatus(filePath)`, `releaseStaleLocks(maxAgeMs = 30000)`.
  - [x] `acquire` returns `{ acquired: boolean; owner?: 'ui' | 'agent' }`.
  - [x] Log all lock operations via `electron-log`.

- [x] **Task 2 — Add IPC channels for file write and lock operations** (AC: #3, #4, #6, #7, #8)
  - [x] Update `src/shared/ipc-channels.ts` with `file:write`, `file:lock`, `file:unlock`, `file:lockStatus`.
  - [x] Expose channels in `src/preload/index.ts`.
  - [x] Implement handlers in `src/main/ipc.ts`:
    - `file:write` resolves absolute path, acquires UI lock, checks `lastMtimeMs` against current `stat.mtimeMs`, writes atomically (`writeFile(temp)` → `rename`), releases lock, returns new `mtimeMs`.
    - Throw structured errors with codes: `FILE_LOCKED`, `FILE_CHANGED`, `FILE_WRITE_ERROR`.

- [x] **Task 3 — Implement renderer status persistence helpers** (AC: #6, #7, #8, #9)
  - [x] Create `src/renderer/lib/file-writer.ts` with `writeStoryStatus(story, newStatus)` and `writeEpicStatus(epic, newStatus)`.
  - [x] Parse existing markdown with `gray-matter`, update only the `status` frontmatter field (and `updatedAt` if present), preserve body.
  - [x] Validate generated markdown by re-parsing before calling `file:write`.
  - [x] After successful write, trigger `syncEngine.forceFullSync()` so the store reflects the change.
  - [x] Surface lock/mtime conflicts and failures as toasts via `useToast`.

- [x] **Task 4 — Add `useFileLock` hook for UI** (AC: #3, #4)
  - [x] Create `src/renderer/hooks/useFileLock.ts` returning `{ locked, owner, acquire, release }`.
  - [x] Back it by `window.electronAPI.fileLock` / `fileUnlock` / `fileLockStatus`.
  - [x] Clean up pending UI locks on unmount.

- [x] **Task 5 — Remove create/delete actions and add status controls** (AC: #1, #10, #11)
  - [x] `src/renderer/pages/EpicsPage.tsx`: remove Create Epic button and modal wiring.
  - [x] `src/renderer/pages/BacklogPage.tsx`: remove Create Story button and modal wiring; add status `<select>` on each story row.
  - [x] `src/renderer/pages/BoardPage.tsx`: add status `<select>` on each card (full drag-and-drop deferred to Epic 5b-ii).
  - [x] `src/renderer/pages/StoryDetailPage.tsx`: replace static `StatusBadge` with a status `<select>`.
  - [x] `src/renderer/pages/DashboardPage.tsx`: remove the "or create an epic manually" hint.
  - [x] Keep `CreateModal.tsx` in codebase for future reuse; do not delete it.

- [x] **Task 6 — Add i18n keys** (AC: #4, #6, #8, #9, #11)
  - [x] Add to both `ru` and `en` dictionaries:
    - `toast.fileLockedByAgent`
    - `toast.fileChanged`
    - `toast.statusUpdated`
    - `toast.statusUpdateFailed`
    - `story.changeStatus`

- [x] **Task 7 — Write tests** (AC: #12)
  - [x] `src/main/services/file-lock.test.ts`: acquire/release, stale cleanup, cross-owner rejection.
  - [x] `src/renderer/lib/file-writer.test.ts`: status-only frontmatter change, invalid frontmatter rollback, sync trigger.
  - [x] `src/renderer/hooks/useFileLock.test.tsx`: IPC-backed acquire/release/status.
  - [x] `src/renderer/pages/BacklogPage.test.tsx` / `EpicsPage.test.tsx`: no create buttons, status select present.
  - [x] Run `npm run test` — all tests pass.

- [x] **Task 8 — Final verification** (AC: #12)
  - [x] `npm run lint` zero errors.
  - [x] `npm run test` all green (264 tests).
  - [x] No `alert()` calls.
  - [x] All new UI text i18n-ready and uses design tokens.

## Dev Notes

### Critical Context: What Already Exists

- **Epic 3 completed** — `FileWatcher` emits `file:changed`; `SyncEngine` re-parses changed files; manual sync button in sidebar.
- **IPC infrastructure** — plain `ipcMain.handle('channel', ...)` strings in `src/main/ipc.ts`; follow existing `domain:operation` convention.
- **Renderer ↔ main bridge** — `window.electronAPI` in `src/preload/index.ts`.
- **Toast system** (`useToast`) is the only user-facing notification mechanism; do not use `alert()`.
- **Store** — Zustand `useAppStore` in `src/renderer/lib/store.ts`. `updateStoryStatus(id, status)` already updates state and recalculates parent epic status.
- **Markdown parsing** — `src/renderer/lib/markdown-parser.ts` has `parseStoryFile`, `parseEpicFile`, `syncMarkdownToStore`. `persistStoryStatus` / `persistEpicStatus` are TODO stubs.
- **File reading** — `file:read` IPC channel returns `{ content: string; exists: boolean }`.
- **Project context is stale** — `_bmad-output/project-context.md` still describes the old Next.js stack. Real stack: Electron + Vite + React Router v6 + Zustand.
- **226 tests pass** at end of Story 3.2. Target: 240+ after this story.

### Architecture Compliance

- **File naming:** kebab-case for lib/service files (`file-lock.ts`, `file-writer.ts`), PascalCase for React components/hooks.
- **Service boundaries:** file lock in `src/main/services/`; writing orchestration in `src/renderer/lib/`; UI controls in `src/renderer/pages/`.
- **IPC channel naming:** use `domain:operation` (`file:write`, `file:lock`, `file:unlock`, `file:lockStatus`).
- **TypeScript strict mode:** no `any`. Explicitly type IPC payloads and lock results.
- **Error format:** throw `Error` with code: `FILE_LOCKED`, `FILE_CHANGED`, `FILE_WRITE_ERROR`.
- **Logging:** use `electron-log` in main process; `console.error` in renderer only as fallback.
- **No new global state:** `FileLockManager` can be a singleton in main; `useFileLock` hook is local to components.

### File Lock Design

Store lock files in the app user-data directory (obtained via `app.getPath('userData')` in main) so they do not trigger the file watcher. Lock filename is a deterministic hash of the absolute source file path, e.g. `bmad-lock-<sha256>.json`. `acquire` first calls `releaseStaleLocks(30000)`. If a lock is held by another owner and not stale, return `{ acquired: false, owner }`.

### Status Update Flow

1. User selects new status in Backlog/Board/Story detail.
2. Component calls `writeStoryStatus(story, newStatus)` from `file-writer.ts`.
3. `file-writer.ts` reads `story.rawMarkdown` or re-reads `story.sourceFile`, parses with `gray-matter`, updates `status`, validates by re-parsing.
4. Calls `window.electronAPI.fileWrite({ path, content, lastMtimeMs })` where `lastMtimeMs` comes from the last successful `file:read` or `file:write` for that path.
5. Main handler acquires UI lock, checks mtime, writes temp file, renames, releases lock, returns new `mtimeMs`.
6. On success, call `syncEngine.forceFullSync()` and show `toast.statusUpdated`.
7. On `FILE_LOCKED` error, show `toast.fileLockedByAgent`.
8. On `FILE_CHANGED` error, show `toast.fileChanged`.

### Read-Only UI Scope

This story intentionally does **not** implement manual markdown editing. The `MarkdownModal` remains read-only. Story 4.2 will add the manual-edit warning and raw textarea editor.

### What NOT to Do

- Do not implement drag-and-drop Kanban here (Epic 5b-ii).
- Do not implement the manual-edit warning / textarea here (Story 4.2).
- Do not delete `CreateModal.tsx`; only remove its usage from read-only surfaces.
- Do not introduce new dependencies; use existing `gray-matter`, `electron-log`, `lucide-react`.

### Previous Story Intelligence

- **Story 3.2** established `SyncEngine`, `upsertEpic`/`upsertStory` store actions, `aria-live` sync announcements, and the manual sync button.
- All status changes should reuse `useAppStore.updateStoryStatus` for optimistic UI while `file-writer.ts` handles persistence.
- Review pattern from 3.2: always guard async operations with mounted refs and update tests for new UI behavior.

### Project Structure Notes

**New files:**
- `src/main/services/file-lock.ts`
- `src/main/services/file-lock.test.ts`
- `src/renderer/lib/file-writer.ts`
- `src/renderer/lib/file-writer.test.ts`
- `src/renderer/hooks/useFileLock.ts`
- `src/renderer/hooks/useFileLock.test.ts`
- `src/renderer/pages/BacklogPage.test.tsx`
- `src/renderer/pages/EpicsPage.test.tsx`

**Modified files:**
- `src/shared/ipc-channels.ts` — add file channels
- `src/preload/index.ts` — expose file channels
- `src/main/ipc.ts` — implement file channels
- `src/renderer/lib/i18n.tsx` — new i18n keys
- `src/renderer/lib/markdown-parser.ts` — remove TODO stubs or wire them to `file-writer.ts`
- `src/renderer/pages/EpicsPage.tsx` — remove create button
- `src/renderer/pages/BacklogPage.tsx` — remove create button, add status select
- `src/renderer/pages/BoardPage.tsx` — add status select
- `src/renderer/pages/StoryDetailPage.tsx` — add status select
- `src/renderer/pages/DashboardPage.tsx` — remove create-epic hint

## Dev Agent Record

### Agent Model Used

opencode-go/kimi-k2.7-code

### Debug Log References

- Captured in test runs and lint passes

### Completion Notes List

- [x] File lock manager implemented with disk-based locks and 30s stale timeout
- [x] IPC file write/lock channels added and exposed via preload
- [x] Renderer `file-writer.ts` updates story/epic status frontmatter atomically
- [x] `useFileLock` hook available for UI components
- [x] Create/delete buttons removed from Dashboard, Backlog, Epics, Story detail, Docs
- [x] Status `<select>` added to Backlog, Board, and Story detail
- [x] i18n keys added for EN/RU
- [x] Tests added and all 264 existing tests still pass (38 new tests added)

### Review Findings

- [x] [Review][Patch] Typo: `result.writeStoryStatus` should be `result.code` in error check [StoryDetailPage.tsx:61] — **dismissed**: actual file already uses `result.code`, diff was misleading
- [x] [Review][Patch] TOCTOU race in FileLockManager.acquire — fixed with `O_CREAT | O_EXCL` atomic open [file-lock.ts]
- [x] [Review][Patch] Lock not filesystem-level — documented limitation, external writers bypass sidecar locks [file-lock.ts design]
- [x] [Review][Patch] Malformed IPC params: `file:lockStatus` defines `{file, content}` instead of `{path}` [ipc-channels.ts:100] — **dismissed**: actual file uses `{ path: string }`, auditor misread diff
- [x] [Review][Patch] Unconditional lock release in catch may release another owner's lock — fixed with `lockAcquired` guard [ipc.ts]
- [x] [Review][Patch] `file:write` error after successful rename masks write success — fixed with `renameSucceeded` flag + fallback stat [ipc.ts]
- [x] [Review][Patch] Rapid-fire dropdown changes cause status rollback — fixed with `inFlightRef` guard [BacklogPage/BoardPage]
- [x] [Review][Patch] `useFileLock` cleanup misses in-flight acquire on unmount — fixed with `pendingAcquireRef` tracking [useFileLock.ts]
- [x] [Review][Patch] Stale lock released between `releaseStaleLocks` and lock read in acquire — mitigated by atomic `O_CREAT | O_EXCL` open [file-lock.ts]
- [x] [Review][Patch] No frontmatter validation before `file:write` in IPC handler — validation done in `file-writer.ts` before IPC call, by design
- [x] [Review][Patch] `file:write` mtime check catches stat failure incorrectly — fixed with explicit `ENOENT` check [ipc.ts]
- [x] [Review][Patch] `file:write` does not log via electron-log — added logging for lock deny, mtime mismatch, success, and errors [ipc.ts]
- [x] [Review][Patch] `getStatus` uses hardcoded 30000ms — fixed with configurable `staleMs` instance field [file-lock.ts]
- [x] [Review][Patch] `writeStoryStatus` re-reads file without acquiring lock — documented intentional read-before-write pattern [file-writer.ts]
- [x] [Review][Patch] Windows `rename` fails if target is memory-mapped — fixed with `EPERM`/`EBUSY` fallback to copy+unlink [ipc.ts]
- [x] [Review][Patch] No path validation beyond `resolve()` — added project root prefix check [ipc.ts]
- [x] [Review][Patch] Lock stale override (30s) not implemented in `file:write` path — `releaseStaleLocks` called before `acquire` in FileLockManager
- [x] [Review][Patch] `setCurrentMtimeMs` mutates store object — fixed with separate `mtimeCache` Map [file-writer.ts]
- [x] [Review][Patch] `ensureLockDir` silently swallows directory creation errors — now throws after logging [file-lock.ts]
- [x] [Review][Defer] Dead i18n keys after removing create UI (`epics.create`, `backlog.createStory`) [i18n.tsx] — deferred, pre-existing
- [x] [Review][Defer] Redundant `getStory` calls in StoryDetailPage handler [StoryDetailPage.tsx] — deferred, pre-existing
- [x] [Review][Defer] Duplicate `handleStatusChange` logic in BacklogPage/BoardPage [Both files] — deferred, pre-existing

### Change Log

- 2026-07-08: Story 4.1 implemented — file lock manager, atomic writes, status persistence, read-only UI, i18n keys, tests

### File List

See "Project Structure Notes" above for full new and modified file list.
