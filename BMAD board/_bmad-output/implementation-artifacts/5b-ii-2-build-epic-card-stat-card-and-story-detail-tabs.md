---
baseline_commit: 5acc004dbf49be2060cd0b1810ed157f126a973a
status: done
---

# Story 5b-ii.2: Build Epic Card, Stat Card, and Story Detail Tabs

Status: done

## Story

As a user,
I want to see epic summaries and story details in polished cards and tabs,
So that I can scan progress and read content easily.

## Acceptance Criteria

**Given** the Epics page  
**When** it loads  
**Then** Epic Cards are in 3-column grid  
**And** each card shows: key badge (accent-light bg, caption mono), title (h3), description (line-clamp-2, body-sm), status badge, priority badge, progress bar (accent fill), labels row  
**And** hover: shadow lift, title shifts to accent color  
**And** click navigates to epic detail  
**And** Stat Card (Dashboard) has 4-card grid: icon badge (colored circle 48x48), caption label, h1 value, optional caption subtitle  
**And** Stat Card click navigates to relevant surface  
**And** hover: shadow lift per stat-card.hover-shadow  
**And** Story Detail Tabs: horizontal underline style  
**And** active tab: accent bottom border (2px) + accent foreground  
**And** inactive: foreground-tertiary + transparent border  
**And** Info tab: description, acceptance criteria (checklist), task list with checkboxes, sidebar metadata  
**And** Markdown tab: rendered content / raw editor toggle  
**And** all labels i18n-ready (EN/RU)

## Tasks / Subtasks

- [x] Task 1: Create EpicCard component (AC: 3-col grid, key badge, progress bar, labels)
  - [x] Subtask 1.1: Implement EpicCard with Card base + epic-specific content
  - [x] Subtask 1.2: Calculate progress from epic.stories array (done / total * 100)
  - [x] Subtask 1.3: Style hover effects (shadow lift, title → accent)
  - [x] Subtask 1.4: Add click navigation to `/epics/${epic.id}`
  - [x] Subtask 1.5: Write unit tests for EpicCard
- [x] Task 2: Create StatCard component (AC: icon badge, caption, h1, subtitle, navigation)
  - [x] Subtask 2.1: Implement StatCard with Card base + stat layout
  - [x] Subtask 2.2: Map 4 dashboard stats to Lucide icons and navigation paths
  - [x] Subtask 2.3: Style 48x48 colored icon badge circles
  - [x] Subtask 2.4: Write unit tests for StatCard
- [x] Task 3: Create StoryDetailTabs component (AC: underline tabs, Info + Markdown)
  - [x] Subtask 3.1: Implement tab bar with underline style (active: accent 2px border + accent fg)
  - [x] Subtask 3.2: Implement Info tab: description, AC checklist, task checkboxes, metadata sidebar
  - [x] Subtask 3.3: Implement Markdown tab: rendered markdown / raw editor toggle
  - [x] Subtask 3.4: Wire StoryDetailTabs into StoryDetailPage
  - [x] Subtask 3.5: Write unit tests for StoryDetailTabs
- [x] Task 4: Refactor EpicsPage to use EpicCard grid (AC: 3-column grid, no create button)
  - [x] Subtask 4.1: Replace current list layout with `grid-cols-3` EpicCard grid
  - [x] Subtask 4.2: Update EpicsPage tests
- [x] Task 5: Refactor DashboardPage to use StatCard (AC: 4-card grid, navigation)
  - [x] Subtask 5.1: Replace current simple cards with StatCard components
  - [x] Subtask 5.2: Map each stat to correct icon, color, label, subtitle, navigation path
  - [x] Subtask 5.3: Update DashboardPage tests
- [x] Task 6: Refactor StoryDetailPage to use StoryDetailTabs (AC: tabs, no content loss)
  - [x] Subtask 6.1: Extract existing sections into Info tab content
  - [x] Subtask 6.2: Add Markdown tab with rendered/raw toggle
  - [x] Subtask 6.3: Preserve all existing functionality (status change, MarkdownModal, file edit)
  - [x] Subtask 6.4: Update StoryDetailPage tests
- [x] Task 7: i18n updates (AC: all new labels EN/RU)
  - [x] Subtask 7.1: Add tab label keys, progress label, metadata labels
  - [x] Subtask 7.2: Verify all existing keys still valid

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Technology Stack:**
- React 18.3 SPA with React Router v6
- Zustand for state (`useAppStore` in `src/renderer/lib/store.ts`)
- Tailwind CSS 3.4 with CSS custom properties (design tokens)
- TypeScript strict mode (`strict: true`, no `any`)
- Vitest for unit tests, co-located as `.test.ts`/`.test.tsx`
- Lucide icons ONLY — zero emoji-as-icons

**Store Patterns:**
- `getStoriesByEpic(epicId)` returns stories for an epic
- `getTask(taskId)` returns a task by ID
- `getStats()` returns `{ totalEpics, totalStories, totalTasks, storiesByStatus, totalStoryPoints, completedStoryPoints }`
- `getEpic(id)` returns epic by ID
- `getStory(id)` returns story by ID
- Do NOT mutate Maps directly — use immutable Zustand updates

**Component Patterns:**
- New components go in `src/renderer/components/` as PascalCase `.tsx`
- Default exports for React components
- Use existing `Card.tsx` as base for EpicCard and StatCard
- Reuse `StatusBadge`, `PriorityBadge` from `src/renderer/components/StatusBadge.tsx`
- Path alias: `@/components/X`, `@/lib/store`, `@/lib/types`, etc.

**Routing:**
- Epic detail: `/epics/${epic.id}`
- Story detail: `/stories/${story.id}` (already exists)
- Board: `/board`
- Backlog: `/backlog`
- Use `useNavigate` from `react-router-dom`

### Source Tree Components to Touch

**Files to CREATE:**
1. `src/renderer/components/EpicCard.tsx` — Epic summary card
2. `src/renderer/components/EpicCard.test.tsx` — EpicCard unit tests
3. `src/renderer/components/StatCard.tsx` — Dashboard stat card
4. `src/renderer/components/StatCard.test.tsx` — StatCard unit tests
5. `src/renderer/components/StoryDetailTabs.tsx` — Tabbed story detail view
6. `src/renderer/components/StoryDetailTabs.test.tsx` — StoryDetailTabs unit tests

**Files to UPDATE:**
1. `src/renderer/pages/EpicsPage.tsx` — Replace list with 3-col EpicCard grid
2. `src/renderer/pages/EpicsPage.test.tsx` — Update tests for new layout
3. `src/renderer/pages/DashboardPage.tsx` — Replace simple cards with StatCard grid
4. `src/renderer/pages/DashboardPage.test.tsx` — Update tests for StatCard
5. `src/renderer/pages/StoryDetailPage.tsx` — Replace flat layout with StoryDetailTabs
6. `src/renderer/pages/StoryDetailPage.test.tsx` — Update tests for tabs
7. `src/renderer/lib/i18n.tsx` — Add new translation keys

**Files to READ but NOT modify (for reference):**
- `src/renderer/components/Card.tsx` — Base card styling (surface-elevated, border-default, rounded-lg, shadow-card, hover lift)
- `src/renderer/components/StatusBadge.tsx` — StatusBadge and PriorityBadge components
- `src/renderer/lib/store.ts` — Store API for data access
- `src/renderer/lib/types.ts` — Epic, Story, Task interfaces
- `src/renderer/lib/markdown-render.ts` — `renderMarkdown()` and `renderMarkdownInline()` functions
- `src/renderer/components/MarkdownModal.tsx` — Existing markdown editor modal (preserve!)

### Critical: Current Page States

**Current EpicsPage (`src/renderer/pages/EpicsPage.tsx`):**
- Uses a vertical `space-y-4` list of `<Card>` components
- Each card shows: title, key, description, StatusBadge, PriorityBadge, stories count, created date
- NO "Create epic" button currently present (read-first app)
- Uses `epics` array from `useAppStore`

**What MUST change:**
- Layout: switch from vertical list to `grid grid-cols-3 gap-4`
- Cards: use new `EpicCard` component instead of raw Card
- EpicCard must compute progress from `epic.stories` array

**What MUST be preserved:**
- Empty state ("No epics" message)
- Loading state
- NO create/delete buttons anywhere

**Current DashboardPage (`src/renderer/pages/DashboardPage.tsx`):**
- 4 simple `<Card>` components in a `grid-cols-4` layout
- Shows: totalEpics, totalStories, active (in-progress + in-review), completed (done)
- Each card is just a big number + label
- NO icons, NO navigation, NO subtitles
- Navigates to `/welcome` if no data

**What MUST change:**
- Use `StatCard` component for each of the 4 stats
- Add Lucide icons in colored 48x48 circles
- Add navigation on click
- Add optional subtitles where relevant

**Stat mapping (CRITICAL — do not change this mapping):**
| Stat | Icon | Icon Color | Label (EN) | Label (RU) | Subtitle | Navigate To |
|------|------|------------|------------|------------|----------|-------------|
| totalEpics | `Box` (lucide) | accent (teal) | "Epics" | "Эпики" | None | `/epics` |
| totalStories | `BookOpen` | status-done-fg (green) | "Stories" | "Стори" | None | `/backlog` |
| active | `Target` | status-in-progress-fg (amber) | "Active" | "В работе" | "In Progress + In Review" / "В работе + На ревью" | `/board` |
| completed | `CheckSquare` | status-done-fg (green) | "Completed" | "Завершено" | None | `/board` |

**What MUST be preserved:**
- Navigate to `/welcome` when no data
- Loading state
- Status distribution bar chart below stat cards

**Current StoryDetailPage (`src/renderer/pages/StoryDetailPage.tsx`):**
- Flat layout: title + status select + priority badge, then sections stacked vertically
- Sections: description (rendered markdown), acceptance criteria (checklist with ✓), tasks, labels
- Has `MarkdownModal` for editing raw file
- Has `openMdModal` function that reads file via `window.electronAPI?.fileRead()`
- Has `handleStatusChange` with optimistic update + writeStoryStatus + rollback
- Has `handleSaveMarkdown` for saving markdown edits

**What MUST change:**
- Wrap content in `StoryDetailTabs` with two tabs: "Info" and "Markdown"
- Info tab contains: description, acceptance criteria, tasks, labels, metadata sidebar
- Markdown tab contains: rendered markdown view of the story file + raw editor toggle
- Tab bar: horizontal underline style

**What MUST be preserved:**
- Status Select dropdown and its `handleStatusChange` behavior (optimistic + rollback)
- PriorityBadge display
- MarkdownModal functionality (do NOT remove or break)
- `handleSaveMarkdown` behavior
- `openMdModal` behavior
- All error handling and toast notifications
- File read via `window.electronAPI?.fileRead()`
- Not found state
- Loading state

### UX Design Specs (from DESIGN.md + EXPERIENCE.md)

**Epic Card:**
- Background: `var(--color-surface-elevated)` (inherits from Card)
- Border: `var(--color-border-default)` 1px (inherits from Card)
- Radius: `rounded.lg` (14px) (inherits from Card)
- Shadow: Card default shadow
- Hover: shadow lifts per `{components.epic-card.hover-shadow}`, title color shifts to `accent`
- Layout:
  - Key badge: `caption` mono font, `accent-light` bg, `rounded.sm`, px-2 py-0.5
  - Title: `h3` font (16px/600), color shifts to `accent` on hover
  - Description: `body-sm` (13px), `text-foreground-secondary`, `line-clamp-2`
  - Status badge + Priority badge inline
  - Progress bar: full width, height 4px, `bg-surface-sunken` track, `bg-accent` fill, `rounded.full`
  - Labels row: flex wrap gap-1, each label is `caption` font, `bg-surface-sunken`, `text-foreground-secondary`, `rounded.sm`, px-1.5 py-0.5
- Click: navigates to `/epics/${epic.id}`
- ARIA: `role="article"`, `aria-label` with epic title

**Stat Card:**
- Background: `var(--color-surface-elevated)` (inherits from Card)
- Radius: `rounded.lg` (14px)
- Shadow: Card default shadow
- Hover: shadow lifts per `{components.stat-card.hover-shadow}` + `translateY(-1px)`
- Layout:
  - Icon badge: 48x48 circle, colored background, white icon centered
    - Epics: `bg-accent` + white `Box` icon (24px)
    - Stories: `bg-status-done-bg` + `text-status-done-fg` `BookOpen` icon (24px)
    - Active: `bg-status-in-progress-bg` + `text-status-in-progress-fg` `Target` icon (24px)
    - Completed: `bg-status-done-bg` + `text-status-done-fg` `CheckSquare` icon (24px)
  - Label: `caption` font (12px/500), `text-foreground-tertiary`, uppercase
  - Value: `h1` font (24px/700), `text-foreground-primary`
  - Subtitle (optional): `caption` font, `text-foreground-tertiary`
- Click: navigates to relevant surface
- Cursor: `cursor-pointer` on entire card
- ARIA: `role="button"`, `aria-label` with stat description

**Story Detail Tabs:**
- Tab bar: horizontal, underline style
  - Active tab: 2px bottom border `accent`, `text-accent` foreground
  - Inactive tab: transparent bottom border, `text-foreground-tertiary`
  - Tab container: border-bottom `border-default` 1px
  - Tab padding: px-4 py-2
  - Tab font: `body` (14px/400)
  - Tab gap: gap-6 between tabs
- Info tab content:
  - Two-column layout: main content (2/3) + metadata sidebar (1/3)
  - Description: rendered markdown via `renderMarkdown()` in a prose-styled div
  - Acceptance Criteria: checklist with checkmark icon (`Check` from Lucide, 14px, `text-accent`) for each item
  - Tasks: list with checkboxes (use native `<input type="checkbox">` styled, or visual checkbox icons). Each task shows: status badge + title
  - Metadata sidebar: `bg-surface-sunken`, `rounded.lg`, p-4
    - Epic: epic title with link
    - Assignee: if present
    - Story Points: if present
    - Labels: flex wrap of label badges
    - Source file: if present, clickable link to open MarkdownModal
- Markdown tab content:
  - Toggle switch: "Rendered" / "Raw" (or "Просмотр" / "Исходник")
  - Rendered view: `renderMarkdown(rawContent)` in prose-styled div
  - Raw view: `<textarea>` with `JetBrains Mono`, `bg-surface-sunken`, `rounded.lg`, readOnly (or editable with save button)
  - If no raw markdown available, show "No markdown content" / "Нет Markdown содержимого"

**Transitions:**
- Hover/active: 80–150ms ease-out
- Tab switch: instant (no animation needed for content switch)
- No bouncy/spring animations

### Testing Standards Summary

- Co-located `.test.tsx` files alongside components
- Mock Zustand store for component tests (do NOT test against real store state)
- Use Vitest + @testing-library/react
- Follow AAA pattern: Arrange, Act, Assert
- Test EpicCard: renders epic data, shows progress bar, navigates on click, hover styles
- Test StatCard: renders stat data, shows icon, navigates on click
- Test StoryDetailTabs: switches tabs, renders Info content, renders Markdown content
- Test page refactors: verify existing functionality still works (status change, modal, etc.)

### Project Structure Notes

- Alignment with unified project structure:
  - Components: `src/renderer/components/PascalCase.tsx`
  - Pages: `src/renderer/pages/PascalCasePage.tsx`
  - Tests: co-located `*.test.tsx`
  - Lib: `src/renderer/lib/kebab-case.ts`
- Detected conflicts or variances:
  - Architecture doc lists `src/renderer/pages/Board.tsx` but actual file is `BoardPage.tsx` — follow existing convention (`BoardPage.tsx`)
  - Architecture doc lists `src/renderer/stores/` but actual store is in `src/renderer/lib/store.ts` — follow existing convention (`lib/store.ts`)

### CRITICAL: No Create/Delete Buttons

This is a **read-first application**. The UI does NOT expose create or delete operations for epics, stories, tasks, or documents.
- Do NOT add "Create epic" or "Create story" buttons to EpicsPage or StoryDetailPage
- Do NOT add "Delete" actions anywhere
- The existing BacklogPage has a "Create story" button — that is the ONLY exception and was implemented in earlier stories. Do NOT add more create buttons.

### CRITICAL: Preserve Existing Error Handling

The StoryDetailPage has careful error handling:
- `mountedRef` for unmount safety
- `handleStatusChange` does optimistic update → write → rollback on failure
- `handleSaveMarkdown` handles FILE_LOCKED, FILE_CHANGED, generic errors
- Toast notifications for all outcomes

When refactoring into tabs, ALL of this must be preserved exactly. The dev agent must NOT simplify or remove any error handling.

### CRITICAL: Progress Calculation

Epic progress is NOT stored in the Epic type. It must be computed at render time:
```typescript
const epicStories = useAppStore((s) => s.getStoriesByEpic(epic.id));
const doneCount = epicStories.filter((s) => s.status === 'done').length;
const progress = epicStories.length > 0 ? Math.round((doneCount / epicStories.length) * 100) : 0;
```

Do NOT add `progress` to the Epic interface. Do NOT store progress in the store.

### i18n Keys to Add

```
// Tab labels
'story.tab.info': 'Info' / 'Информация'
'story.tab.markdown': 'Markdown' / 'Markdown'
'story.progress': 'Progress' / 'Прогресс'
'story.noMarkdown': 'No markdown content' / 'Нет Markdown содержимого'

// Stat card labels (verify existing keys, may already exist)
'dashboard.epics': 'Epics' / 'Эпики'        // EXISTS
'dashboard.stories': 'Stories' / 'Стори'   // EXISTS
'dashboard.active': 'Active' / 'В работе'  // EXISTS
'dashboard.completedCard': 'Completed' / 'Завершено' // EXISTS
```

Note: Most dashboard labels already exist. Only tab labels and `noMarkdown` need to be added.

### References

- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Components — Epic Card / Stat Card / Story Detail Tabs]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#Component Patterns — Epic card / Stat card / Story detail tabs]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5b-ii — Story 5b-ii.2]
- [Source: src/renderer/components/Card.tsx — base card styling]
- [Source: src/renderer/components/StatusBadge.tsx — badge components]
- [Source: src/renderer/pages/EpicsPage.tsx — current epics list]
- [Source: src/renderer/pages/DashboardPage.tsx — current dashboard]
- [Source: src/renderer/pages/StoryDetailPage.tsx — current story detail]
- [Source: src/renderer/lib/store.ts — store API]
- [Source: src/renderer/lib/types.ts — Epic, Story, Task types]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2 — Store Architecture]
- [Source: _bmad-output/project-context.md — Technology Stack & Critical Rules]

## Dev Agent Record

### Agent Model Used

N/A — story file created by create-story workflow

### Debug Log References

No issues encountered.

### Completion Notes List

- EpicCard: uses `useMemo` with `stories` selector to avoid Zustand infinite loop (selector returning new array each call)
- StatCard: accepts icon, iconBg, label, value, subtitle, navigateTo props
- StoryDetailTabs: two-tab layout (Info/Markdown), Info has 2/3 + 1/3 sidebar grid, Markdown has rendered/raw toggle
- All existing error handling in StoryDetailPage preserved (mountedRef, optimistic status update, rollback)
- MarkdownModal preserved unchanged
- i18n keys added: story.tab.info, story.tab.markdown, story.noMarkdown, story.rendered, story.raw, dashboard.activeSubtitle
- 42 test files, 427 tests — all passing

### File List

**Created:**
- `src/renderer/components/EpicCard.tsx`
- `src/renderer/components/EpicCard.test.tsx`
- `src/renderer/components/StatCard.tsx`
- `src/renderer/components/StatCard.test.tsx`
- `src/renderer/components/StoryDetailTabs.tsx`
- `src/renderer/components/StoryDetailTabs.test.tsx`

**Modified:**
- `src/renderer/pages/EpicsPage.tsx`
- `src/renderer/pages/EpicsPage.test.tsx`
- `src/renderer/pages/DashboardPage.tsx`
- `src/renderer/pages/DashboardPage.test.tsx`
- `src/renderer/pages/StoryDetailPage.tsx`
- `src/renderer/pages/StoryDetailPage.test.tsx`
- `src/renderer/lib/i18n.tsx`

### Change Log

- Created EpicCard component with progress bar, key badge, labels, hover effects, click navigation
- Created StatCard component with Lucide icon badges, navigation, subtitles
- Created StoryDetailTabs component with Info (description, AC, tasks, metadata sidebar) and Markdown (rendered/raw toggle) tabs
- Refactored EpicsPage from vertical list to 3-column EpicCard grid
- Refactored DashboardPage from simple cards to StatCard grid with icons and navigation
- Refactored StoryDetailPage to use StoryDetailTabs, preserving all error handling and MarkdownModal
- Added i18n keys for tab labels, rendered/raw toggle, active stat subtitle
- Epic in sidebar is plain text (no link navigation)
- Pencil icon on Markdown tab opens EditWarningDialog then MarkdownModal for file editing

### Review Findings

#### decision-needed

- [x] [Review][Decision] Epic sidebar: link vs plain text — Spec says "epic title with link", but plain text is intentional to keep navigation minimal in sidebar metadata area. Confirmed by user (2026-07-13).

#### patch

- [x] [Review][Patch] ARIA semantics missing on progress bar — Progress bar div has no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Screen readers see an empty element. [EpicCard.tsx:82-87]
- [x] [Review][Patch] No keyboard support on cards — EpicCard `role="article"` and StatCard `role="button"` lack `tabIndex`, `onKeyDown` (Enter/Space). Keyboard-only users cannot navigate. [EpicCard.tsx:57-61, StatCard.tsx:20-26]
- [x] [Review][Patch] EpicCard over-subscribes to store — `useAppStore((s) => s.stories)` subscribes every card to all stories; any story change re-renders all EpicCards. Use a stable selector or memoize. [EpicCard.tsx:9-12]
- [x] [Review][Patch] epic.labels null-safety — `epic.labels.length > 0` throws if labels is undefined/null. Use optional chaining: `epic.labels?.length > 0`. [EpicCard.tsx:44]
- [x] [Review][Patch] loadMarkdown has no error handling — `fileRead` in StoryDetailPage has no try/catch; a failed read causes unhandled promise rejection or error object stored as mdContent. [StoryDetailPage.tsx:loadMarkdown]
- [x] [Review][Patch] Missing i18n key `story.progress` — Spec mentions `'story.progress': 'Progress' / 'Прогресс'` but no such key was added to i18n. [i18n.tsx]
- [x] [Review][Patch] toast.kanbanRetry leaks from kanban story — Translation key `toast.kanbanRetry` belongs to story 5b-ii.1, bleeds into this changeset. [i18n.tsx:98,1200]
- [x] [Review][Patch] Raw markdown uses `<pre>` not `<textarea>` — Spec says "textarea with JetBrains Mono, bg-surface-sunken, rounded.lg, readOnly". Code uses `<pre className="font-mono...">`. [StoryDetailTabs.tsx:raw view]

#### defer

- [x] [Review][Defer] No responsive breakpoints on EpicsPage grid — `grid-cols-3` has no sm/md/lg variants; cramped on narrow viewports. Deferred: responsive layout not in AC scope. [EpicsPage.tsx:33]
- [x] [Review][Defer] Progress bar shows 0% for small ratios — `Math.round(1/201*100)` = 0%. Use `Math.max(1, ...)` when doneCount > 0. Deferred: edge case UX polish. [EpicCard.tsx:15]
- [x] [Review][Defer] Missing React.memo on card components — EpicCard/StatCard re-render on parent list changes regardless of prop changes. Deferred: performance optimization, not a bug. [EpicCard.tsx, StatCard.tsx]
- [x] [Review][Defer] Hardcoded magic strings — Route paths, localStorage keys, tab identifiers are inline literals. Deferred: pre-existing pattern in codebase. [Multiple files]
- [x] [Review][Defer] StatCard.iconBg coupling through raw class strings — Every call site hardcodes Tailwind classes. Deferred: design preference for semantic variants would be a separate refactor. [StatCard.tsx, DashboardPage.tsx]

---

**Story ID:** 5b-ii.2
**Story Key:** 5b-ii-2-build-epic-card-stat-card-and-story-detail-tabs
**Epic:** Epic 5b-ii — Rich Components & Content Rendering
**Status:** done
**Created:** 2026-07-13
**Completion Note:** Ultimate context engine analysis completed — comprehensive developer guide created
