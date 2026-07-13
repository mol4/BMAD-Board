---
baseline_commit: 5acc004dbf49be2060cd0b1810ed157f126a973a
status: done
---

# Story 5b-ii.1: Build Kanban Board with Status-Only Drag-and-Drop

Status: done

## Story

As a user,
I want to drag story cards across status columns,
so that I can update story status visually without creating or deleting anything.

## Acceptance Criteria

**Given** the Sprint Board page  
**When** it loads  
**Then** 5 columns are visible: backlog, todo, in-progress, in-review, done  
**And** each column shows existing stories parsed from markdown files  
**And** there is NO "Create story" button or "Add card" action anywhere on the board  
**And** each column has sunken fill, `rounded.lg`, top 3px solid status-color strip  
**And** column header shows status label (caption, uppercase) and count badge  
**And** Kanban Card has `rounded.md`, draggable via HTML5 drag-and-drop  
**And** drag ghost: card preview at reduced opacity  
**And** drag state: opacity 0.5, scale 0.95, cursor grabbing  
**And** drop zone: dashed 2px accent border + accent-subtle fill flash (200ms)  
**And** optimistic UI: card moves immediately, status update fires in background  
**And** drop updates story status in markdown frontmatter only (no create/delete)  
**And** failure: toast "Couldn't save. Trying again." + retry icon pulses 30s  
**And** ARIA: columns have `role="list"`, `aria-label` for status; cards `role="listitem"`, `aria-grabbed`  
**And** keyboard alternative: select dropdown for status change (drag is mouse-only)

## Tasks / Subtasks

- [x] Task 1: Create KanbanCard component (AC: drag state, rounded.md, card styling)
  - [x] Subtask 1.1: Implement HTML5 draggable with dragstart/dragend handlers
  - [x] Subtask 1.2: Style drag states (opacity 0.5, scale 0.95, grabbing cursor)
  - [x] Subtask 1.3: Add ARIA roles (listitem, aria-grabbed) and click-to-navigate
  - [x] Subtask 1.4: Write unit tests for KanbanCard
- [x] Task 2: Create KanbanColumn component (AC: sunken fill, status strip, drop zone)
  - [x] Subtask 2.1: Implement dragover/dragleave/drop handlers
  - [x] Subtask 2.2: Style drop zone feedback (dashed accent border, accent-subtle flash 200ms)
  - [x] Subtask 2.3: Add status-color top strip and count badge
  - [x] Subtask 2.4: Write unit tests for KanbanColumn
- [x] Task 3: Refactor BoardPage to use Kanban components (AC: 5 columns, optimistic UI)
  - [x] Subtask 3.1: Replace grid layout with flexbox Kanban layout (min-width 280px per column)
  - [x] Subtask 3.2: Wire drag-and-drop to writeStoryStatus + optimistic update
  - [x] Subtask 3.3: Implement retry UI (pulse icon for 30s on failure)
  - [x] Subtask 3.4: Keep keyboard Select alternative visible on each card
  - [x] Subtask 3.5: Write BoardPage unit tests
- [x] Task 4: i18n updates (AC: all labels EN/RU)
  - [x] Subtask 4.1: Add `toast.kanbanRetry` key ("Couldn't save. Trying again." / "Не удалось сохранить. Повторная попытка…")
  - [x] Subtask 4.2: Verify all existing board keys still valid
- [x] Task 5: Accessibility & UX polish
  - [x] Subtask 5.1: Verify focus rings on Select dropdown
  - [x] Subtask 5.2: Verify aria-live="polite" for status changes
  - [x] Subtask 5.3: Verify no create/delete buttons present

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Technology Stack:**
- React 18.3 SPA with React Router v6 (no Next.js App Router)
- Zustand for state (`useAppStore` in `src/renderer/lib/store.ts`)
- Tailwind CSS 3.4 with CSS custom properties (design tokens)
- HTML5 drag-and-drop API ONLY — do NOT add react-beautiful-dnd, @dnd-kit, or any other DnD library
- TypeScript strict mode (`strict: true`, no `any`)
- Vitest for unit tests, co-located as `.test.ts`/`.test.tsx`

**IPC / File Writing:**
- Use existing `writeStoryStatus(story, newStatus)` from `src/renderer/lib/file-writer.ts`
- It returns `WriteOutcome` (`ok: true` or `ok: false` with code `FILE_LOCKED | FILE_CHANGED | FILE_WRITE_ERROR`)
- On failure, rollback optimistic store update and show toast
- After any write, `syncEngine.forceFullSync()` runs automatically inside `writeStoryStatus`

**Store Patterns:**
- `updateStoryStatus(id, status)` is already optimistic in Zustand store
- `getStoriesByStatus(status)` filters from store
- `recalculateEpicStatus` runs automatically when story status changes
- Do NOT mutate Maps directly — use immutable Zustand updates

**Component Patterns:**
- New components go in `src/renderer/components/` as PascalCase `.tsx`
- Default exports for React components
- Use `'use client'` directive if component uses browser APIs (draggable is browser API, so KanbanCard/KanbanColumn likely need it)
- Path alias: `@/components/X`, `@/lib/store`, `@/lib/types`, etc.

### Source Tree Components to Touch

**Files to CREATE:**
1. `src/renderer/components/KanbanCard.tsx` — Draggable card with story info
2. `src/renderer/components/KanbanCard.test.tsx` — Card unit tests
3. `src/renderer/components/KanbanColumn.tsx` — Drop target column
4. `src/renderer/components/KanbanColumn.test.tsx` — Column unit tests

**Files to UPDATE:**
1. `src/renderer/pages/BoardPage.tsx` — Replace current grid with Kanban board layout
2. `src/renderer/pages/BoardPage.test.tsx` — Update tests for drag-and-drop
3. `src/renderer/lib/i18n.tsx` — Add `toast.kanbanRetry` EN/RU translations

**Files to READ but NOT modify (for reference):**
- `src/renderer/components/Card.tsx` — Reuse styling patterns (surface-elevated, border-default, rounded-lg, shadow-card, hover lift)
- `src/renderer/components/StatusBadge.tsx` — Reuse status/priority badges
- `src/renderer/components/Select.tsx` — Keyboard alternative for status change
- `src/renderer/lib/store.ts` — Understand `updateStoryStatus`, `getStoriesByStatus`
- `src/renderer/lib/file-writer.ts` — Understand `writeStoryStatus` return types
- `src/renderer/lib/types.ts` — `StoryStatus`, `Story` interfaces

### Critical: Current BoardPage State

The current `BoardPage.tsx` (read it fully before modifying) has:
- A 5-column CSS grid (`grid-cols-1 md:grid-cols-5`)
- Columns use `bg-surface-elevated` (WRONG — should be `bg-surface-sunken`)
- No status-color top strip
- Cards are plain divs with Link + Select dropdown
- Already has optimistic `handleStatusChange` with `inFlightRef` to prevent double-submits
- Already handles `FILE_LOCKED`, `FILE_CHANGED`, generic errors with toasts
- Uses `writeStoryStatus` and `updateStoryStatus`

**What MUST change:**
- Layout: switch from CSS grid to flexbox with `min-w-[280px]` columns (per DESIGN.md)
- Columns: use `bg-surface-sunken`, add 3px top border with status color
- Cards: make draggable, add drag states, keep Select dropdown as keyboard alternative
- Add drop-zone visual feedback on columns
- Add retry pulse icon on failure (30s)

**What MUST be preserved:**
- Optimistic UI pattern (update store first, then write file)
- `inFlightRef` to prevent concurrent updates for same story
- Error rollback (revert status on failure)
- All existing toast messages for `FILE_LOCKED`, `FILE_CHANGED`
- Select dropdown for accessibility / keyboard users
- Navigation to story detail on card click

### UX Design Specs (from DESIGN.md + EXPERIENCE.md)

**Kanban Column:**
- Background: `var(--color-surface-sunken)` (light: #F0F1F5, dark: #0A0C12)
- Radius: `rounded.lg` (14px)
- Top strip: 3px solid, color matches status palette:
  - backlog: `var(--color-status-backlog-fg)`
  - todo: `var(--color-status-todo-fg)`
  - in-progress: `var(--color-status-in-progress-fg)`
  - in-review: `var(--color-status-in-review-fg)`
  - done: `var(--color-status-done-fg)`
- Header: `caption` font (12px/500), uppercase, status label + count badge
- Cards stack vertically with gap

**Kanban Card:**
- Background: `var(--color-surface-elevated)` (light: #FFFFFF, dark: #181B23)
- Border: `var(--color-border-default)` 1px
- Radius: `rounded.md` (10px)
- Shadow: `0 1px 2px rgba(0,0,0,0.06)` (light) / `0 1px 2px rgba(0,0,0,0.3)` (dark)
- Hover: shadow lift + translateY(-1px) (reuse Card.tsx hover pattern)
- Drag state: opacity 0.5, scale 0.95, cursor: grabbing
- Content: story key (mono), title (body font), priority badge, status badge (optional), assignee, story points
- Click navigates to `/stories/${story.id}`

**Drop Zone Feedback:**
- On drag over: dashed 2px `var(--color-accent)` border + `var(--color-accent-subtle)` fill
- Flash duration: 200ms ease-out
- On drag leave: revert to normal column styling

**Transitions:**
- Hover/active: 80–150ms ease-out
- Drop flash: 200ms ease-out
- No bouncy/spring animations

### Testing Standards Summary

- Co-located `.test.tsx` files alongside components
- Mock Zustand store for component tests (do NOT test against real store state)
- Mock `writeStoryStatus` for file-write tests
- Use Vitest + @testing-library/react
- Follow AAA pattern: Arrange, Act, Assert
- Test drag-and-drop via fireEvent (dragStart, dragOver, drop, dragEnd)
- Test optimistic UI: verify store updated immediately, then verify rollback on failure
- Test accessibility: verify ARIA roles and aria-grabbed states

### Project Structure Notes

- Alignment with unified project structure:
  - Components: `src/renderer/components/PascalCase.tsx`
  - Pages: `src/renderer/pages/PascalCasePage.tsx`
  - Tests: co-located `*.test.tsx`
  - Lib: `src/renderer/lib/kebab-case.ts`
- Detected conflicts or variances:
  - Architecture doc lists `src/renderer/pages/Board.tsx` but actual file is `BoardPage.tsx` — follow existing convention (`BoardPage.tsx`)
  - Architecture doc lists `src/renderer/stores/` but actual store is in `src/renderer/lib/store.ts` — follow existing convention (`lib/store.ts`)

### References

- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Components — Kanban Column / Kanban Card]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#Component Patterns — Kanban card / Kanban column]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5b-ii — Story 5b-ii.1]
- [Source: src/renderer/pages/BoardPage.tsx — current board implementation]
- [Source: src/renderer/components/Card.tsx — card styling pattern]
- [Source: src/renderer/lib/store.ts — Zustand store API]
- [Source: src/renderer/lib/file-writer.ts — writeStoryStatus API]
- [Source: src/renderer/lib/types.ts — Story, StoryStatus types]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2 — Store Architecture]
- [Source: _bmad-output/project-context.md — Technology Stack & Critical Rules]

## Dev Agent Record

### Agent Model Used

mimo-v2.5-pro

### Debug Log References

### Completion Notes List

- All 5 tasks with 20 subtasks completed
- KanbanCard: HTML5 drag-and-drop, ARIA roles (listitem, aria-grabbed), click/keyboard navigation, drag state styling (opacity 0.5, scale 0.95, cursor grabbing)
- KanbanColumn: dragover/dragleave/drop handlers, drop zone feedback (dashed accent border + accent-subtle flash), status-color top strip, count badge
- BoardPage: refactored from CSS grid to flexbox with min-w-[280px] columns, optimistic UI with inFlightRef, retry pulse icon (30s), Select dropdown preserved as keyboard alternative
- i18n: added toast.kanbanRetry in EN/RU
- 404 tests passing (27 new tests for Kanban components), tsc --noEmit passes

### File List

**Created:**
- `src/renderer/components/KanbanCard.tsx`
- `src/renderer/components/KanbanCard.test.tsx`
- `src/renderer/components/KanbanColumn.tsx`
- `src/renderer/components/KanbanColumn.test.tsx`
- `src/renderer/pages/BoardPage.test.tsx`

**Modified:**
- `src/renderer/pages/BoardPage.tsx`
- `src/renderer/lib/i18n.tsx`

### Change Log

- 2026-07-13: Initial implementation — KanbanCard, KanbanColumn, BoardPage refactor, i18n updates (27 new tests, 404 total passing)

### Review Findings

#### decision-needed

- [x] [Review][Decision] Toast "Trying again" implies retry that doesn't happen — resolved: AC satisfied with visual-only indication (toast text + pulsing icon)

#### patch

- [x] [Review][Patch] Missing catch block — writeStoryStatus throws not caught [BoardPage.tsx:36-79] — Added catch block that rolls back optimistic update on thrown exceptions.
- [x] [Review][Patch] BoardPage never re-renders on external store mutations [BoardPage.tsx:18-19] — Added `useAppStore((s) => s.stories)` subscription to trigger re-renders.
- [x] [Review][Patch] Drag ghost renders at full opacity [KanbanCard.tsx:14-20] — Added `setDragImage()` with cloned element at opacity 0.5 + scale 0.95; guarded for jsdom test env.
- [x] [Review][Patch] No same-status guard [BoardPage.tsx:82-88] — Added `if (story.status === newStatus) return` early return.
- [x] [Review][Patch] `as Node` cast on relatedTarget [KanbanColumn.tsx:33] — Replaced with `instanceof Node` check.
- [x] [Review][Patch] Invalid storyId from external drag sources [KanbanColumn.tsx:41-44] — Already guarded by `getStory()` check in `handleStatusChange`; no change needed.
- [x] [Review][Patch] Stale closure after store deletion [BoardPage.tsx:37-38] — Already guarded by `if (!story) return` in `handleStatusChange`; no change needed.
- [x] [Review][Patch] `as StoryStatus` cast — no runtime validation [BoardPage.tsx:87] — Added `COLUMNS.includes()` runtime guard in `handleSelectChange`.

#### defer

- [x] [Review][Defer] Drag styles not verified after dragEnd [KanbanCard.test.tsx] — deferred, test coverage gap
- [x] [Review][Defer] Card shadow deviates from UX spec [KanbanCard.tsx:38] — deferred, uses existing `shadow-card` design token
