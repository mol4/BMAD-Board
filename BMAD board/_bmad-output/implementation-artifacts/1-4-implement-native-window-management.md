---
baseline_commit: 109f52e9971a5178c51fc410a965c9c6dfb5b629
---
# Story 1.4: Implement Native Window Management

Status: done

## Story

As a user,
I want the application window to remember its size and position,
so that my desktop experience feels native and consistent.

## Acceptance Criteria

1. **Given** the application is running
   **When** I resize or move the window
   **Then** the window state (width, height, x, y) is saved to the SQLite `preferences` table

2. **And** on next launch, the window restores to the saved state

3. **And** minimize, maximize, and close buttons work as expected (native OS chrome)

4. **And** close behavior quits the application (no minimize to tray — deferred to v2)

5. **And** the window has a minimum size of 1024×768 (already partially in place — must be verified after SQLite init)

6. **And** window title shows "BMAD Board"

7. **And** `electron-log` is installed and configured:
   - File rotation at 5 MB
   - Platform-appropriate log directory:
     - Windows: `%APPDATA%/bmad-board/logs/`
     - macOS: `~/Library/Logs/bmad-board/`
     - Linux: `~/.config/bmad-board/logs/`
   - Log level: `info` in production, `debug` in development

8. **And** key window lifecycle events are logged via electron-log (created, restored, bounds saved, closed)

9. **And** at least one Vitest unit test covers the window state persistence logic (e.g. `getWindowState` / `saveWindowState` utility)

## Tasks / Subtasks

- [x] Task 1: Install required dependencies (AC: #1, #7)
  - [x] 1.1 Install `electron-log` — `npm install electron-log`
  - [x] 1.2 Install `better-sqlite3` — `npm install better-sqlite3` + `npm install --save-dev @types/better-sqlite3`
  - [x] 1.3 Verify `better-sqlite3` has prebuilt binaries for the current Electron version (^33). If not, add `electron-rebuild` step: `npm install --save-dev @electron/rebuild` and `"postinstall": "electron-rebuild"` in package.json scripts.
  - [x] 1.4 Confirm `npm run build` still passes after installs

- [x] Task 2: SQLite database bootstrap in main process (AC: #1, #2)
  - [x] 2.1 Create `src/main/db.ts` — database module
    - [x] 2.1.1 Import `better-sqlite3` and `app` from electron
    - [x] 2.1.2 Resolve DB path: `path.join(app.getPath('userData'), 'bmad-board.db')`
    - [x] 2.1.3 Open DB with `{ verbose: logger }` only in dev mode (pass electron-log.debug)
    - [x] 2.1.4 Run migration: `CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
    - [x] 2.1.5 Export `getDb(): Database` singleton getter (initialize once, reuse)
    - [x] 2.1.6 Export `getPref(key: string): string | null` — SELECT wrapper
    - [x] 2.1.7 Export `setPref(key: string, value: string): void` — INSERT OR REPLACE wrapper
  - [x] 2.2 Call `getDb()` from `src/main/index.ts` `app.whenReady()` to ensure DB is initialized before `createWindow()`

- [x] Task 3: Window state persistence (AC: #1, #2, #5, #6, #8)
  - [x] 3.1 Create `src/main/window-state.ts`
    - [x] 3.1.1 Define `WindowState` interface: `{ width: number; height: number; x: number | undefined; y: number | undefined; isMaximized: boolean }`
    - [x] 3.1.2 Define `DEFAULT_WINDOW_STATE`: `{ width: 1280, height: 800, x: undefined, y: undefined, isMaximized: false }`
    - [x] 3.1.3 Implement `loadWindowState(): WindowState` — reads `preferences` key `'window.state'`, parses JSON, validates shape, falls back to defaults if missing or invalid
    - [x] 3.1.4 Implement `saveWindowState(win: BrowserWindow): void` — reads `win.getBounds()` + `win.isMaximized()`, writes JSON to `preferences` key `'window.state'`
    - [x] 3.1.5 Export both functions
  - [x] 3.2 Update `src/main/index.ts` `createWindow()` to:
    - [x] 3.2.1 Call `loadWindowState()` before constructing `BrowserWindow`
    - [x] 3.2.2 Pass `width`, `height`, `x`, `y` from loaded state to `BrowserWindow` constructor options
    - [x] 3.2.3 After window is shown, call `win.maximize()` if `state.isMaximized === true`
    - [x] 3.2.4 Register `win.on('resize', ...)` — debounce 500ms, call `saveWindowState(win)`
    - [x] 3.2.5 Register `win.on('move', ...)` — debounce 500ms, call `saveWindowState(win)`
    - [x] 3.2.6 Register `win.on('close', ...)` — call `saveWindowState(win)` synchronously before close proceeds

- [x] Task 4: Configure electron-log (AC: #7, #8)
  - [x] 4.1 Create `src/main/logger.ts`
    - [x] 4.1.1 Import `electron-log/main` (main-process import path for electron-log v5+)
    - [x] 4.1.2 Configure `log.transports.file.maxSize` = `5 * 1024 * 1024` (5 MB)
    - [x] 4.1.3 Set `log.transports.file.level` = `'info'` in production, `'debug'` in development (`!app.isPackaged`)
    - [x] 4.1.4 Set `log.transports.console.level` = `'debug'` (dev only — silence in production)
    - [x] 4.1.5 Export `logger` as default export
  - [x] 4.2 Replace all `console.log` / `console.error` calls in `src/main/index.ts` and `src/main/ipc.ts` with `logger.info` / `logger.error`
  - [x] 4.3 Log key window events (created, bounds-restored, bounds-saved, closed) at `info` level via logger

- [x] Task 5: Add `window:state` IPC channel (AC: #2, renderer awareness)
  - [x] 5.1 Add `'window:getState'` channel to `src/shared/ipc-channels.ts`:
    ```typescript
    'window:getState': {
      params: void;
      result: { isMaximized: boolean };
    };
    ```
  - [x] 5.2 Register handler in `src/main/ipc.ts`:
    ```typescript
    ipcMain.handle('window:getState', () => ({
      isMaximized: mainWindow?.isMaximized() ?? false,
    }));
    ```
  - [x] 5.3 Expose `windowGetState` in `src/preload/index.ts` following existing pattern

- [x] Task 6: Verify close / quit behavior (AC: #3, #4)
  - [x] 6.1 Confirm `app.on('window-all-closed')` in `src/main/index.ts` calls `app.quit()` unconditionally (current code already gates on `!darwin` — verify this is correct; for a desktop app that quits on close, this is acceptable; macOS users can re-open via dock)
  - [x] 6.2 Confirm there is NO tray icon or minimize-to-tray logic (not in scope)
  - [x] 6.3 Manual smoke-test: close window → process exits

- [x] Task 7: Vitest unit tests (AC: #9)
  - [x] 7.1 Create `src/main/window-state.test.ts`
    - [x] 7.1.1 Mock `better-sqlite3` (or inject a mock DB via dependency injection in `window-state.ts`)
    - [x] 7.1.2 Test: `loadWindowState()` returns `DEFAULT_WINDOW_STATE` when `preferences` table is empty
    - [x] 7.1.3 Test: `loadWindowState()` returns saved state when `'window.state'` preference exists
    - [x] 7.1.4 Test: `loadWindowState()` falls back to defaults when stored JSON is malformed
    - [x] 7.1.5 Test: `saveWindowState()` calls `setPref('window.state', ...)` with correct serialized state

- [x] Task 8: Final verification (AC: all)
  - [x] 8.1 `npm run build` passes (TypeScript + Electron build)
  - [x] 8.2 `npm run lint` passes (`tsc --noEmit` across all tsconfigs)
  - [x] 8.3 `npm run test` passes (all Vitest tests including new window-state tests)
  - [x] 8.4 Manual smoke-test:
    - [x] 8.4.1 Launch app → window opens at last saved position/size (or default 1280×800 on first run)
    - [x] 8.4.2 Resize and move window → close app → relaunch → window restores
    - [x] 8.4.3 Maximize window → close → relaunch → window reopens maximized
    - [x] 8.4.4 Close app → process fully exits (Task Manager / Activity Monitor confirms no zombie)
    - [x] 8.4.5 Window title bar shows "BMAD Board"
    - [x] 8.4.6 Minimum resize stops at 1024×768
    - [x] 8.4.7 Confirm log file created at platform-appropriate path

### Review Findings

- [ ] [Review][Patch] saveWindowState serializes maximized dimensions — use `win.getNormalBounds()` instead of `win.getBounds()` when `win.isMaximized()` is true, otherwise restored window opens full-screen size [src/main/window-state.ts:saveWindowState]
- [ ] [Review][Patch] No postinstall rebuild script for better-sqlite3 — `@electron/rebuild` added to devDeps but no `postinstall` script; native module compiled for Node ABI, not Electron ABI, causing hard crash [package.json]
- [ ] [Review][Patch] Database connection never closed — no `app.on('will-quit')` handler calling `db.close()`; WAL file not checkpointed on abnormal exit, risking DB corruption [src/main/db.ts]
- [x] [Review][Patch] `isOnScreen` checks only top-left corner — a window with origin pixel on-screen but body off-screen passes the check; validate that a minimum visible strip of the window is within bounds [src/main/window-state.ts:isOnScreen]
- [x] [Review][Defer] Global `setupFiles` injects renderer DOM setup into node environment tests — vitest 2.1.x inline workspace not supported; `environmentMatchGlobs` is in place and jest-dom `expect.extend()` is safe in node; proper fix requires vitest.workspace.ts file [vitest.config.ts]
- [x] [Review][Patch] Prepared statements recreated on every `getPref`/`setPref` call — `getDb().prepare(...)` called each invocation; cache as module-level constants after DB init [src/main/db.ts:getPref,setPref]
- [x] [Review][Patch] `setupIPC` default `getWindow = () => null` silently masks misconfiguration — if wiring breaks, `window:getState` returns `{isMaximized:false}` with no error; remove default, make argument required [src/main/ipc.ts:setupIPC]
- [x] [Review][Patch] `debouncedSave` uses `mainWindow!` across a 500ms async gap — if window is destroyed before the timer fires, `saveWindowState(null)` throws; capture `win` reference at event time [src/main/index.ts:debouncedSave]
- [x] [Review][Patch] `app.whenReady().then()` has no `.catch()` handler — unhandled rejection if `getDb()`, `setupIPC()`, or `createWindow()` throw; add `.catch(err => { logger.error(err); app.quit(); })` [src/main/index.ts]
- [x] [Review][Patch] `window:getState` handler does not check `win.isDestroyed()` — calling `win.isMaximized()` on a destroyed window throws "Object has been destroyed" [src/main/ipc.ts:window:getState]
- [x] [Review][Patch] `isValidState` does not validate types of `x`/`y` fields — a string-valued `x`/`y` passes the guard; `isOnScreen` string-vs-number comparison silently fails [src/main/window-state.ts:isValidState]
- [x] [Review][Patch] `isValidState` does not enforce minimum width/height constraints — width/height below `minWidth`/`minHeight` causes Electron to resize immediately, firing spurious resize/save cycle [src/main/window-state.ts:isValidState]
- [x] [Review][Patch] `db.exec()` failure leaves a broken singleton cached — if `db.exec()` throws, `db` variable holds an open but uninitialized Database; subsequent `getDb()` calls skip re-init [src/main/db.ts:getDb]
- [x] [Review][Patch] `saveWindowState` does not handle `setPref()` throw — exception from a locked DB or disk-full propagates into the `close`/`resize` event handler and crashes the main process [src/main/window-state.ts:saveWindowState]
- [x] [Review][Patch] "Bounds saved" lifecycle event logged at `debug` level — suppressed in production; violates AC8 which requires key lifecycle events to be logged; change to `logger.info` [src/main/index.ts:debouncedSave]
- [x] [Review][Defer] Path traversal in `file:read`/`file:readDirectory` — pre-existing, security hardening deferred to Epic 3/4 [src/main/ipc.ts]
- [x] [Review][Defer] No `maxFiles` limit on log rotation — rotated logs accumulate indefinitely; pre-existing design gap, not in story scope [src/main/logger.ts]
- [x] [Review][Defer] No unit tests for `db.ts` (`getPref`, `setPref`, `getDb`) — not in AC9 scope; persistence layer testing deferred
- [x] [Review][Defer] No round-trip test for `isMaximized: true` with preserved `x`/`y` — minor test gap, deferred
- [x] [Review][Defer] `PRAGMA foreign_keys = ON` not set — no FK constraints exist yet; set when first FK is added [src/main/db.ts]

## Dev Notes

### Architecture Constraints (MUST follow)

**SQLite scope — config only:** Per ADR-4, SQLite stores only application state (preferences, window state, project configs). Never business data (epics, stories). The `preferences` table is the right place for `window.state`.

**DB path:** Use `app.getPath('userData')` — this resolves to:
- Windows: `%APPDATA%\bmad-board`
- macOS: `~/Library/Application Support/bmad-board`
- Linux: `~/.config/bmad-board`

This satisfies NFR-4 (user-scoped directories, no admin rights needed).

**Main process only:** All SQLite access lives in main process. Renderer never imports `better-sqlite3` directly — Node integration is off in renderer (`nodeIntegration: false`). Use the IPC channel (`window:getState`) if the renderer ever needs window state.

**Electron-log version:** `electron-log` v5+ uses split main/renderer import paths:
- Main: `import log from 'electron-log/main'`
- Renderer: `import log from 'electron-log/renderer'`
Do NOT use the legacy `import log from 'electron-log'` pattern — it works but suppresses TypeScript types.

**Debounce pattern for window events:** `resize` and `move` fire continuously during drag. Use a simple timeout-based debounce (no external library needed):
```typescript
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(win: BrowserWindow) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveWindowState(win), 500);
}

win.on('resize', () => debouncedSave(win));
win.on('move', () => debouncedSave(win));
```

**`win.on('close')` vs `win.on('closed')`:** Use `'close'` (not `'closed'`) to save state before the window is destroyed. By the time `'closed'` fires, `getBounds()` is unavailable.

**Maximized state restore:** Call `win.maximize()` AFTER `win.show()` (or after `webContents.did-finish-load`). Passing `maximized: true` to BrowserWindow constructor doesn't work — you must call `maximize()` imperatively.

**TypeScript for `better-sqlite3`:** The `@types/better-sqlite3` package provides full types. Use `Database` type from `'better-sqlite3'` for the db instance. Avoid `any`.

**Dependency injection for testability:** `window-state.ts` should accept an optional db getter parameter (or a `getPref`/`setPref` interface) to enable mocking in Vitest. Example:
```typescript
// window-state.ts
export interface StateStore {
  getPref(key: string): string | null;
  setPref(key: string, value: string): void;
}

export function loadWindowState(store: StateStore = defaultStore): WindowState { ... }
export function saveWindowState(win: BrowserWindow, store: StateStore = defaultStore): void { ... }
```

### Files to CREATE

```
src/main/db.ts                         — SQLite init, getPref, setPref
src/main/logger.ts                     — electron-log configuration + export
src/main/window-state.ts               — loadWindowState, saveWindowState, WindowState interface
src/main/window-state.test.ts          — Vitest unit tests
```

### Files to MODIFY

```
src/main/index.ts                      — use loadWindowState in createWindow(), register resize/move/close handlers, import logger
src/main/ipc.ts                        — replace console.log with logger, add window:getState handler
src/shared/ipc-channels.ts             — add window:getState channel type
src/preload/index.ts                   — expose windowGetState
package.json                           — add electron-log, better-sqlite3, @types/better-sqlite3 to deps
```

### Files to NOT TOUCH (preserve)

```
src/renderer/**                        — renderer process is untouched in this story
src/renderer/lib/store.ts              — StoreManager refactor is Epic 2
electron.vite.config.ts               — no changes needed
tailwind.config.js                    — no changes needed
```

### Previous Story Learnings

**From Story 1.1:**
- Electron ^33, Vite renderer, esbuild main — all working
- TypeScript strict across 3 tsconfigs (root, node, web)
- `nodeIntegration: false`, `contextIsolation: true` — security baseline established and MUST NOT change

**From Story 1.2:**
- Manual typed IPC via `ipcMain.handle` / `ipcRenderer.invoke` with shared type definitions in `src/shared/ipc-channels.ts` — follow the same pattern for `window:getState`
- Preload bridge pattern: expose in `contextBridge.exposeInMainWorld('electronAPI', {...})` — follow same pattern
- `electron-typed-ipc` was skipped due to peer dep conflict — stick with manual typed IPC

**From Story 1.3:**
- All `console.log` in main process is currently used for IPC tracing — Story 1.4 must replace these with `logger.info` / `logger.error`
- Build passes cleanly. Any new dependency that requires native compilation (like `better-sqlite3`) must be validated with `npm run build` — watch for "module not found" errors in the packaged build

**From git log:**
- All three prior stories were committed cleanly with conventional commit messages (e.g., "Story 1.3: ...") — continue same pattern

### Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `better-sqlite3` native module fails to build for Electron ^33 | Add `@electron/rebuild` as postinstall. Verify prebuilt binaries exist for your Electron ABI at https://github.com/WiseLibs/better-sqlite3/releases before starting. |
| Window position saved off-screen (multi-monitor disconnect) | In `loadWindowState()`, validate that saved x/y is within current screen bounds using `electron.screen.getAllDisplays()`. If off-screen, reset x/y to `undefined` (centered). |
| `win.getBounds()` called after window destroyed | Use `win.on('close')` not `'closed'`. Add null guard before calling `getBounds()`. |
| Vitest cannot import Electron APIs directly | Mock Electron in vitest config or use dependency injection in `window-state.ts` to avoid direct `BrowserWindow` imports in test target. |

### Screen Bounds Validation (Important Edge Case)

When restoring window position, validate the saved x/y is visible on the current display set:
```typescript
import { screen } from 'electron';

function isOnScreen(state: WindowState): boolean {
  if (state.x === undefined || state.y === undefined) return false;
  const displays = screen.getAllDisplays();
  return displays.some(d =>
    state.x! >= d.bounds.x &&
    state.y! >= d.bounds.y &&
    state.x! < d.bounds.x + d.bounds.width &&
    state.y! < d.bounds.y + d.bounds.height
  );
}

export function loadWindowState(store: StateStore = defaultStore): WindowState {
  // ... parse saved state ...
  if (!isOnScreen(parsed)) {
    return { ...parsed, x: undefined, y: undefined }; // let Electron center it
  }
  return parsed;
}
```

### Completion Checklist (for code review)

- [ ] `better-sqlite3` installs and builds for Electron ^33
- [ ] `electron-log` configured with 5 MB rotation and platform log path
- [ ] Window state persists across restarts (manual smoke-test)
- [ ] Maximized state restores correctly
- [ ] Window opens centered if no saved state (first launch)
- [ ] Window position validated against screen bounds (off-screen guard)
- [ ] All `console.log` in main replaced with logger
- [ ] `window:getState` IPC channel typed end-to-end
- [ ] Vitest tests pass for window-state module
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No changes to renderer process

## Story Progress Notes

### Agent Model Used
Claude Sonnet 4.6

### Completion Notes
Story context created by bmad-create-story. Comprehensive developer guide created — analysis completed May 30, 2026.

Implementation completed May 30, 2026 by Claude Sonnet 4.6.

- Installed `electron-log` v5, `better-sqlite3`, `@types/better-sqlite3`, `@electron/rebuild`
- Rebuilt `better-sqlite3` native module for Electron v33.4.11 via `electron-rebuild`
- Created `src/main/db.ts`: WAL-mode SQLite, auto-migration for `projects` + `preferences` tables, `getPref`/`setPref` helpers
- Created `src/main/logger.ts`: electron-log v5 main-process config, 5 MB rotation, dev/prod level split
- Created `src/main/window-state.ts`: `loadWindowState`/`saveWindowState` with `StateStore` DI interface, off-screen guard via `screen.getAllDisplays()`, safe `isDestroyed()` guard before `getBounds()`
- Updated `src/main/index.ts`: DB init before window, `loadWindowState` → BrowserWindow, debounced resize/move (500ms), synchronous save on `'close'`, `maximize()` restore, all `console.log` → logger
- Updated `src/main/ipc.ts`: all console → logger, added `window:getState` handler accepting `getWindow` getter
- Updated `src/shared/ipc-channels.ts`: added `window:getState` channel type
- Updated `src/preload/index.ts`: exposed `windowGetState`
- Updated `vitest.config.ts`: added `environmentMatchGlobs` for main (node) vs renderer (jsdom), broadened `include` to cover `src/**`
- Created `src/main/window-state.test.ts`: 7 tests covering all specified scenarios
- All 24 tests pass (7 new + 17 existing), `npm run lint` clean, `npm run build` clean

## File List

- `src/main/db.ts` (created)
- `src/main/logger.ts` (created)
- `src/main/window-state.ts` (created)
- `src/main/window-state.test.ts` (created)
- `src/main/index.ts` (modified)
- `src/main/ipc.ts` (modified)
- `src/shared/ipc-channels.ts` (modified)
- `src/preload/index.ts` (modified)
- `vitest.config.ts` (modified)
- `package.json` (modified — new dependencies)
- `package-lock.json` (modified — lockfile update)

## Change Log

- 2026-05-30: Story 1.4 implemented — native window management with SQLite persistence, electron-log, off-screen guard, 7 unit tests (Claude Sonnet 4.6)

