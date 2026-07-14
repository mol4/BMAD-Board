---
story_id: '4.3'
story_key: 4-3-sync-story-status-to-sprint-status-yaml
epic: 4
title: Sync Story Status Changes to sprint-status.yaml
status: done
previous_story: 4-1-implement-file-lock-status-update-and-read-only-document-view
date: '2026-07-08'
baseline_commit: 9fec27515f4bbe8c6b11cf96157dbd68b5f3b2c3
---

# Story 4.3: Sync Story Status Changes to sprint-status.yaml

Status: done

## Story

As a user,
I want the app to update sprint-status.yaml when I change a story status in the UI,
So that my sprint tracking stays in sync without manual file edits.

## Acceptance Criteria

1. **Given** a story status change succeeds via `writeStoryStatus`  
   **When** the write completes  
   **Then** the app also updates the matching entry in `sprint-status.yaml`  
   **And** the `last_updated` field is refreshed to the current date

2. **Given** the sprint-status.yaml file path is known  
   **When** the app updates it  
   **Then** it uses the same `file:write` IPC channel with mtime tracking  
   **And** preserves all comments, structure, and STATUS DEFINITIONS sections

3. **Given** the sprint-status.yaml file does not exist or cannot be found  
   **When** a status change completes  
   **Then** the YAML update is silently skipped  
   **And** no error toast is shown (non-blocking feature)

4. **Given** the story key does not have a matching entry in sprint-status.yaml  
   **When** the app attempts to update it  
   **Then** the operation is skipped gracefully  
   **And** a warning is logged (not surfaced to user)

5. **Given** the YAML update fails (lock held, file changed, write error)  
   **When** the status change write succeeds  
   **Then** the story status change is still considered successful  
   **And** the YAML sync failure is logged but does not block the primary operation

6. **Given** a status change is rolled back due to FILE_LOCKED or FILE_CHANGED  
   **When** the rollback occurs  
   **Then** no sprint-status.yaml update is attempted

7. **Given** the implementation is complete  
   **When** `npm run lint` runs  
   **Then** zero TypeScript errors are produced  
   **And** `npm run test` — all existing tests continue to pass  
   **And** new tests verify YAML update logic, missing file handling, and key-not-found handling

## Tasks / Subtasks

- [x] **Task 1 — Add sprint-status.yaml path resolution** (AC: #2, #3)
  - [x] Create `src/renderer/lib/sprint-status-path.ts` that resolves the sprint-status.yaml path from the store config (epicsDir/storiesDir parent → `_bmad-output/implementation-artifacts/sprint-status.yaml`)
  - [x] Export `resolveSprintStatusPath(): string | null`

- [x] **Task 2 — Add YAML update helper** (AC: #1, #2, #4, #5)
  - [x] Create `src/renderer/lib/sprint-status-sync.ts` with `updateSprintStatus(storyKey: string, newStatus: string): Promise<boolean>`
  - [x] Read current sprint-status.yaml via `file:read` IPC
  - [x] Parse YAML (use simple string manipulation or a lightweight YAML parser — no new dependencies if possible; the file structure is predictable)
  - [x] Find the `development_status` entry matching `storyKey` (pattern: `N-N-...: <status>`)
  - [x] Replace the status value with the new one
  - [x] Update `last_updated:` line to current date
  - [x] Write back via `file:write` IPC with `lastMtimeMs` tracking
  - [x] Return `true` on success, `false` on any failure (non-blocking)

- [x] **Task 3 — Wire into status change flow** (AC: #1, #3, #6)
  - [x] In `file-writer.ts`, after `writeStoryStatus` succeeds, call `updateSprintStatus(story.key, newStatus)`
  - [x] Only attempt if `story.key` exists and the write was successful
  - [x] Do NOT attempt if the primary write was rolled back

- [x] **Task 4 — Add tests** (AC: #7)
  - [x] `src/renderer/lib/sprint-status-sync.test.ts`: update existing key, key not found, file not found, write failure
  - [x] Update `file-writer.test.ts` to verify sprint-status sync is called after successful write
  - [x] Run `npm run test` — all green

- [x] **Task 5 — Final verification** (AC: #7)
  - [x] `npm run lint` zero errors
  - [x] `npm run test` all green
  - [x] No new dependencies added

## Dev Notes

### Critical Context

- **Story 4.1 completed** — `writeStoryStatus` in `file-writer.ts` handles atomic file writes with lock/mtime guards. After success, it calls `syncEngine.forceFullSync()`.
- **sprint-status.yaml location**: `_bmad-output/implementation-artifacts/sprint-status.yaml` relative to project root
- **File structure is predictable**: YAML with `development_status:` section containing entries like `4-1-implement-file-lock-...: done`
- **No new dependencies** — use string manipulation or regex for YAML parsing; the format is line-based and consistent
- **Non-blocking** — YAML sync failure must never block or roll back the primary status change

### Status Mapping

The UI uses these statuses: `backlog`, `todo`, `in-progress`, `in-review`, `done`
sprint-status.yaml uses: `backlog`, `ready-for-dev`, `in-progress`, `review`, `done`

**Mapping required:**
| UI Status | Sprint Status |
|-----------|---------------|
| `backlog` | `backlog` |
| `todo` | `ready-for-dev` |
| `in-progress` | `in-progress` |
| `in-review` | `review` |
| `done` | `done` |

### YAML Update Strategy

The sprint-status.yaml has a predictable format:
```yaml
development_status:
  # Epic 4: ...
  epic-4: in-progress
  4-1-implement-file-lock-...: done
  4-2-implement-manual-edit-...: backlog
```

Simple line-by-line replacement is sufficient:
1. Find line matching `^  {story_key}: .+$`
2. Replace with `  {story_key}: {mappedStatus}`
3. Find `last_updated: .+` line and replace with current date
4. Preserve all comments, blank lines, and structure

### Integration Point

```typescript
// In file-writer.ts, after successful write:
if (result.ok) {
  // Existing:
  await syncEngine.forceFullSync();
  
  // New (non-blocking):
  try {
    await updateSprintStatus(story.key, newStatus);
  } catch {
    console.warn('[file-writer] Sprint status sync failed (non-blocking)');
  }
}
```

### What NOT to Do

- Do not add `js-yaml` or any YAML parsing library — the format is simple enough for regex/string ops
- Do not block the status change if YAML sync fails
- Do not show user-facing errors for YAML sync failures
- Do not modify sprint-status.yaml structure or comments

### Previous Story Intelligence

- **Story 4.1** established `file:write` with atomic writes, lock management, mtime tracking, and `forceFullSync()` after writes
- The `mtimeCache` in `file-writer.ts` tracks last known mtime per file — use this pattern for sprint-status.yaml too
- Error codes: `FILE_LOCKED`, `FILE_CHANGED`, `FILE_WRITE_ERROR` — all handled gracefully in the call chain

## Dev Agent Record

### Completion Notes

**Story 4.3 completed 2026-07-08**

Implemented sprint-status.yaml automatic sync when story status changes:

- **sprint-status-path.ts** — resolves sprint-status.yaml path from storesDir config
- **sprint-status-sync.ts** — reads, parses (string manipulation, no new deps), updates status line and last_updated, writes back via `file:write` IPC with mtime tracking. Maps UI statuses to sprint statuses (todo→ready-for-dev, in-review→review). Returns false on any failure without throwing; all failures are logged to console.warn.
- **file-writer.ts** — after successful `writeStoryStatus`, fire-and-forget calls `updateSprintStatus()` with `.catch()` (non-blocking). Only fires if `result.ok` is true — skipped on FILE_LOCKED/FILE_CHANGED/write errors.
- **Tests** — sprint-status-sync.test.ts (11 tests): updates existing key, status mapping (todo→ready-for-dev, in-review→review), last_updated update, comments/structure preservation, missing file, key not found, write failure, missing storiesDir, IPC reject, mtime tracking across writes. file-writer.test.ts (2 new tests): sprint-status sync called after success, not called after failure.

**Verification:** `npm run lint` — zero errors. `npm run test` — 277 tests pass (0 failures). No new dependencies added.

## File List

- `src/renderer/lib/sprint-status-path.ts` (new)
- `src/renderer/lib/sprint-status-sync.ts` (new)
- `src/renderer/lib/file-writer.ts` (modified)
- `src/renderer/lib/sprint-status-sync.test.ts` (new)
- `src/renderer/lib/file-writer.test.ts` (modified)

## Change Log

- 2026-07-08: Implemented sprint-status.yaml auto-sync on story status changes (Tasks 1-5 complete)

### Review Findings

- [x] [Review][Patch] `.catch()` is dead code — `updateSprintStatus` never throws, always resolves `true`/`false` [file-writer.ts:78]
- [x] [Review][Patch] Test pollution — `mockResolvedValue(true)` at module scope, `mockClear()` doesn't reset implementations [file-writer.test.ts:21]
- [x] [Review][Patch] Duplicate `setupWindowMock()` call in `beforeEach` [file-writer.test.ts:79]
- [x] [Review][Patch] Race condition in test — fire-and-forget means assertion may run before mock is called [file-writer.test.ts:187]
- [x] [Review][Patch] `updateStatusLine` strips trailing YAML comments on status lines [sprint-status-sync.ts:44]
- [x] [Review][Patch] `resolveSprintStatusPath` accepts whitespace-only `storiesDir` [sprint-status-path.ts:6]
- [x] [Review][Patch] Missing integration test for YAML sync failure path through `writeStoryStatus` [file-writer.test.ts]
- [x] [Review][Defer] `updateStatusLine` false-positive match inside YAML block scalars [sprint-status-sync.ts:42] — deferred, unlikely given predictable YAML structure
- [x] [Review][Defer] `updateLastUpdated` silently no-ops when `last_updated` field absent [sprint-status-sync.ts:62] — deferred, file structure is predictable per spec
- [x] [Review][Defer] External modification of sprint-status.yaml causes silent sync failure [sprint-status-sync.ts:100] — deferred, by design per AC5
