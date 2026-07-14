---
story_id: 2.3
story_key: 2-3-build-project-switcher-ui
epic: 2
title: Build Project Switcher UI
status: review
previous_story: 2-2-implement-storemanager-with-per-project-isolation
date: 2026-06-09
baseline_commit: eb10067bf4b9403e9bcb21b56bf77b85329060f6
---

# Story 2.3: Build Project Switcher UI

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Change Log

- 2026-06-09: Implemented ProjectSwitcher component with dropdown, keyboard nav, ARIA, i18n, toast integration
- 2026-06-09: Integrated ProjectSwitcher into Sidebar header, replacing static header block
- 2026-06-09: Added 7 i18n keys (projectSwitcher.*, toast.*) to both RU and EN dictionaries
- 2026-06-09: Created 19 unit tests in ProjectSwitcher.test.tsx covering rendering, dropdown, switching, keyboard nav, ARIA
- 2026-06-09: Full test suite: 160 tests pass (14 test files), lint passes with zero errors

## Story

As a user,
I want to see and switch between my projects from the sidebar,
So that I can work on multiple BMAD projects quickly.

## Acceptance Criteria

1. **Given** two or more projects are configured in SQLite
   **When** I open the project switcher in the sidebar
   **Then** I see a list of all projects with names and last-used timestamps
   **And** the current active project is visually highlighted
   **And** projects are ordered by `lastUsedAt` descending (most recent first)

2. **And** clicking a project triggers `storeManager.switchProject(projectId)`
   **And** the sidebar UI updates to show the new active project name
   **And** the main content area re-renders with the new project's data
   **And** a toast shows: "Project switched" / "Проект переключён" on success

3. **And** the last-used project is automatically loaded on application launch
   **Already implemented in Story 2.2 via Providers.tsx + StoreManager**
   **This AC verifies it still works after adding the switcher UI**

4. **And** switching projects completes in under 2 seconds (SM-4)
   **And** rapid clicks are debounced to prevent concurrent switches (StoreManager handles 300ms debounce)
   **And** the switcher UI is disabled during an active switch (spinner or opacity reduction)

5. **And** project switcher has keyboard navigation (Tab, Enter, Escape)
   **And** ARIA: `role="listbox"`, `aria-label="Project switcher"`, `aria-expanded` on the trigger button
   **And** each project item has `role="option"`, `aria-selected` for the active item
   **And** focus trap is NOT needed (this is a dropdown, not a modal)

6. **And** i18n labels added to both RU and EN dictionaries:
   - `"projectSwitcher.title"` → "Projects" / "Проекты"
   - `"projectSwitcher.switchProject"` → "Switch project" / "Сменить проект"
   - `"projectSwitcher.currentProject"` → "Current project" / "Текущий проект"
   - `"projectSwitcher.noProjects"` → "No projects" / "Нет проектов"
   - `"projectSwitcher.switching"` → "Switching..." / "Переключение..."
   - `"toast.projectSwitched"` → "Project switched" / "Проект переключён"
   - `"toast.projectSwitchError"` → "Failed to switch project" / "Не удалось переключить проект"

7. **And** `npm run lint` produces zero TypeScript errors
   **And** `npm run test` — all existing tests (134+) continue to pass
   **And** new tests in `Sidebar.test.tsx` or a dedicated `ProjectSwitcher.test.tsx` verify:
   - Renders list of projects when opened
   - Calls `storeManager.switchProject` on click
   - Shows current active project
   - Keyboard navigation (Enter selects, Escape closes)
   - ARIA attributes are correct

## Tasks / Subtasks

- [x] **Task 1 — Create `ProjectSwitcher` component** (AC: #1, #2, #4, #5, #6)
  - [x] Create `src/renderer/components/ProjectSwitcher.tsx`.
  - [x] Fetch project list via `window.electronAPI.projectList()` on mount and on switcher open.
  - [x] Render a dropdown/popover trigger button in the sidebar header area (see Placement section below).
  - [x] Display project name and a `ChevronDown` / `ChevronUp` icon indicating open state.
  - [x] Dropdown list: `bg-surface-elevated`, `border border-border-default`, `rounded-lg`, `shadow-lg`.
  - [x] Each project row: `px-3 py-2`, hover `bg-accent-subtle`, active project `bg-accent text-foreground-on-accent`.
  - [x] Show `lastUsedAt` formatted as relative time (e.g., "2 hours ago" / "2 часа назад") or short date if >24h.
  - [x] Clicking a project calls `storeManager.switchProject(project.id)` (already debounced internally).
  - [x] During switch: disable list items, show spinner or reduce opacity.
  - [x] After successful switch: close dropdown, show toast via `useToast()`.
  - [x] On error: show error toast, close dropdown, keep current project active.
  - [x] Implement keyboard nav: ArrowUp/ArrowDown to move focus, Enter to select, Escape to close.
  - [x] Use `useRef` and `useEffect` for focus management inside the list.
  - [x] Click outside closes dropdown (use a `useClickOutside` hook or `document` mousedown listener).

- [x] **Task 2 — Integrate ProjectSwitcher into Sidebar** (AC: #1, #2)
  - [x] Import `ProjectSwitcher` in `Sidebar.tsx`.
  - [x] Replace the static header block ("BMAD Board" + "Local project") with the `ProjectSwitcher` trigger.
  - [x] Keep the collapse toggle button (`ChevronLeft`) in the same position.
  - [x] In **collapsed** sidebar mode, show only the current project icon (first letter or a `Folder` icon) and the dropdown opens on click.
  - [x] In **expanded** mode, show the full project name + chevron.
  - [x] Ensure `ProjectSwitcher` receives `collapsed` prop to adjust its layout.

- [x] **Task 3 — Add i18n keys** (AC: #6)
  - [x] Add all 7 keys listed in AC #6 to both `ru` and `en` objects in `src/renderer/lib/i18n.tsx`.
  - [x] Use `useI18n()` hook in `ProjectSwitcher` for all user-facing text.

- [x] **Task 4 — Write tests** (AC: #7)
  - [x] Create `src/renderer/components/ProjectSwitcher.test.tsx`.
  - [x] Mock `window.electronAPI.projectList` to return 2-3 sample projects.
  - [x] Mock `storeManager.switchProject` via `vi.mock('@/lib/store-manager', ...)`.
  - [x] Test: opens dropdown on click, shows project names.
  - [x] Test: clicking a project calls `storeManager.switchProject` with correct ID.
  - [x] Test: active project is visually distinguished (check `aria-selected="true"`).
  - [x] Test: keyboard navigation (ArrowDown, Enter, Escape).
  - [x] Test: closes on click outside.
  - [x] Test: error handling shows toast.
  - [x] Run `npm run test` — all 134+ tests pass.

- [x] **Task 5 — Final verification** (AC: #7)
  - [x] Run `npm run lint` — zero TypeScript errors.
  - [x] Run `npm run test` — all pass.
  - [x] Verify `ProjectSwitcher` uses only design tokens (no hardcoded colors).
  - [x] Verify no `alert()` calls introduced.

## Dev Notes

### Critical Context: What Already Exists

- **StoreManager** (`src/renderer/lib/store-manager.ts`) is a singleton attached to `globalThis.__storeManager`. It handles per-project isolation via snapshots, debounced `switchProject(projectId)` with 300ms trailing debounce, and automatic rollback on error.
  - **DO NOT re-implement debounce logic in the UI.** StoreManager already handles it. Just call `storeManager.switchProject(id)`.
  - **DO NOT try to access `storeManager` internals.** Use only public methods: `switchProject`, `getActiveProjectId`, `getSnapshot`.
  - **DO NOT call `useAppStore.setActiveProject` directly.** StoreManager does this internally.

- **IPC `project:list`** returns `Project[]` (id, name, epicsDir, storiesDir, storiesMode, lastUsedAt, createdAt). This is already wired to real SQLite/JSON storage (Story 2.1).

- **Sidebar** (`src/renderer/components/Sidebar.tsx`) currently has a static header block:
  ```tsx
  <div className="flex items-center justify-between p-4 border-b border-border-default">
    {!collapsed && (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-accent rounded ...">BB</div>
        <div>
          <h1 className="font-bold text-sm">BMAD Board</h1>
          <p className="text-xs text-foreground-tertiary">{t('sidebar.localProject')}</p>
        </div>
      </div>
    )}
    <button onClick={() => setCollapsed(!collapsed)}>...</button>
  </div>
  ```
  Replace this with the `ProjectSwitcher` component. The collapse toggle stays.

- **Toast system** (`useToast` from `@/components/Toast`) is already available. Use `showToast(t('toast.projectSwitched'), 'success')`.

- **i18n** (`useI18n`) is already set up. Add new keys to `src/renderer/lib/i18n.tsx` in both `ru` and `en` objects.

- **Zustand store** (`useAppStore`) has `activeProjectId` state. The `ProjectSwitcher` can read this to highlight the current project. However, since `storeManager` manages the active project, you can also call `storeManager.getActiveProjectId()`.

- **Context pattern** (not Zustand) is used for UI-only state (Toast, Theme). ProjectSwitcher dropdown state (`isOpen`) should use local `useState`.

### Project Switcher Placement

**Visual structure of Sidebar header after change:**

```
┌─────────────────────────────────────────┐
│ [ProjectSwitcher]           [◀ toggle]  │  ← expanded (w-64)
└─────────────────────────────────────────┘

┌────┐
│ [P]│  [◀]                                  ← collapsed (w-16)
└────┘
```

- In expanded mode: `ProjectSwitcher` takes the full width left of the toggle button. Show project name (truncated with ellipsis), current project label, and chevron.
- In collapsed mode: `ProjectSwitcher` shows a small icon (`Folder` or first letter of project name) inside a square. The dropdown still opens centered or aligned to the icon.

**Dropdown placement:**
- Open downward from the trigger.
- Width: `w-64` (same as sidebar expanded) or `min-w-[200px]`.
- Max-height: `max-h-60` with `overflow-y-auto` if many projects.
- z-index: `z-50` to float above content.

### Design Token Compliance

- Trigger button: `bg-surface-elevated text-foreground-primary border border-border-default rounded-md hover:bg-accent-subtle`.
- Active project in list: `bg-accent text-foreground-on-accent`.
- Inactive project: `text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary`.
- Dropdown container: `bg-surface-elevated border border-border-default rounded-lg shadow-lg`.
- Last-used timestamp: `text-foreground-tertiary text-caption`.
- Disabled state during switch: `opacity-50 pointer-events-none`.
- Focus rings: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1` (existing global pattern).

### Architecture Compliance

- **File naming:** `PascalCase.tsx` for React components (`ProjectSwitcher.tsx`, `ProjectSwitcher.test.tsx`).
- **No changes to main process.** All project switching is renderer-side; StoreManager calls IPC internally.
- **No new IPC channels.** `project:list` and `project:switch` are already defined and wired.
- **No changes to Zustand store.** StoreManager handles all store mutations.
- **No changes to tailwind.config.js or package.json.** No new dependencies needed.

### Implementation Details

**Fetching project list:**
```tsx
const [projects, setProjects] = useState<Project[]>([]);
useEffect(() => {
  if (window.electronAPI) {
    window.electronAPI.projectList().then(setProjects).catch(() => setProjects([]));
  }
}, []);
```

**Active project resolution:**
```tsx
const activeProjectId = storeManager.getActiveProjectId();
const activeProject = projects.find(p => p.id === activeProjectId);
```

**Switching:**
```tsx
const handleSelect = async (projectId: string) => {
  setIsSwitching(true);
  try {
    await storeManager.switchProject(projectId);
    showToast(t('toast.projectSwitched'), 'success');
    setIsOpen(false);
  } catch (err) {
    showToast(t('toast.projectSwitchError'), 'error');
    setIsOpen(false);
  } finally {
    setIsSwitching(false);
  }
};
```

**Keyboard navigation:**
- Track `focusedIndex` in state.
- `ArrowDown` → `setFocusedIndex(i => Math.min(i + 1, projects.length - 1))`.
- `ArrowUp` → `setFocusedIndex(i => Math.max(i - 1, 0))`.
- `Enter` → `handleSelect(projects[focusedIndex].id)`.
- `Escape` → `setIsOpen(false)`.
- Focus the first item when dropdown opens.
- Use `useEffect` to programmatically focus the item at `focusedIndex`.

**Click outside:**
```tsx
useEffect(() => {
  if (!isOpen) return;
  const handle = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handle);
  return () => document.removeEventListener('mousedown', handle);
}, [isOpen]);
```

### Date formatting

For `lastUsedAt`, use a simple utility function (no new dependencies):
```tsx
function formatLastUsed(iso: string | null, locale: 'en' | 'ru'): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return locale === 'ru' ? 'Только что' : 'Just now';
  if (diffH < 24) return locale === 'ru' ? `${diffH} ч назад` : `${diffH}h ago`;
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US');
}
```
Place this in `ProjectSwitcher.tsx` as a private helper or in `src/renderer/lib/date-utils.ts` if reuse is expected.

### What NOT to Do (Deferred to Later Stories)

- **Add/Remove Project Flow with validation** → Story 2.4
- **Filesystem watcher** → Epic 3
- **File lock mechanism** → Epic 4
- **Project editing (rename paths)** → Not in scope; users remove and re-add
- **Polished Card/Button hover states** → Epic 5b-i (already partially done, follow existing patterns)

### Previous Story Intelligence (2.2)

- **134 tests pass** at end of Story 2.2. Target: 140+ after this story.
- **StoreManager switchProject** is debounced (300ms). UI should NOT add its own debounce — just call it directly.
- **StoreManager.loadProject** internally calls `window.electronAPI.projectList()` to resolve paths. The UI can pass just the `projectId`.
- **Review findings from 2.2:** All pending promises from rapid `switchProject` calls resolve after the real `_doSwitch` completes. This means the UI can safely call `await storeManager.switchProject(id)` and know it will resolve when the switch is actually done.
- **Retrospective lesson:** Pre-review checklist is mandatory; dev notes must be verifiable against actual file paths.
- **Common review findings:** Use `??` instead of `||` for nullish defaults; validate inputs before casts; handle edge cases in tests.

### Testing Patterns

- **Co-located tests:** `src/renderer/components/ProjectSwitcher.test.tsx` for `ProjectSwitcher.tsx`.
- **Mocking IPC:**
  ```ts
  vi.stubGlobal('window', {
    electronAPI: {
      projectList: vi.fn().mockResolvedValue([
        { id: 'p1', name: 'Project A', epicsDir: '/a', storiesDir: '/a', storiesMode: 'flat', lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        { id: 'p2', name: 'Project B', epicsDir: '/b', storiesDir: '/b', storiesMode: 'flat', lastUsedAt: null, createdAt: new Date().toISOString() },
      ]),
    },
  });
  ```
- **Mocking StoreManager:**
  ```ts
  vi.mock('@/lib/store-manager', () => ({
    storeManager: {
      switchProject: vi.fn().mockResolvedValue(undefined),
      getActiveProjectId: vi.fn().mockReturnValue('p1'),
    },
  }));
  ```
- **Mocking Toast:**
  ```ts
  vi.mock('@/components/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
  }));
  ```
- **Test structure:** `describe()` per behavior (rendering, interaction, keyboard, error), `it()` with descriptive names, AAA pattern.
- **Assertions:** Use `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveAttribute`, `toHaveClass`).

### Project Structure Notes

**New files to create:**
- `src/renderer/components/ProjectSwitcher.tsx` — project switcher dropdown component
- `src/renderer/components/ProjectSwitcher.test.tsx` — Vitest tests

**Files to update:**
- `src/renderer/components/Sidebar.tsx` — integrate ProjectSwitcher into header
- `src/renderer/lib/i18n.tsx` — add project switcher and toast keys

**No changes to:**
- `src/main/*` — IPC handlers stay unchanged
- `src/preload/*` — no new channels
- `src/shared/*` — types unchanged
- `src/renderer/lib/store-manager.ts` — no changes needed
- `src/renderer/lib/store.ts` — no changes needed
- `tailwind.config.js`, `package.json` — no new dependencies

### References

- UX-DR5: Sidebar spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Sidebar`]
- UX-DR24: Accessibility (focus rings, ARIA, keyboard nav) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#Accessibility-Floor`]
- UX-DR25: i18n (EN/RU) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md`]
- Architecture ADR-2: StoreManager pattern [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-2-Store-Architecture`]
- Architecture ADR-1: IPC channels (project:list, project:switch) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-1-IPC-Strategy`]
- Epic 2 Story 2.3 acceptance criteria [Source: `_bmad-output/planning-artifacts/epics.md#Story-23-Build-Project-Switcher-UI`]
- Previous story 2.2 dev notes [Source: `_bmad-output/implementation-artifacts/2-2-implement-storemanager-with-per-project-isolation.md`]
- Existing `Sidebar.tsx` baseline [Source: `src/renderer/components/Sidebar.tsx`]
- Existing `store-manager.ts` baseline [Source: `src/renderer/lib/store-manager.ts`]
- Existing `ipc-channels.ts` baseline [Source: `src/shared/ipc-channels.ts`]

## Dev Agent Record

### Agent Model Used

opencode-go/deepseek-v4-pro

### Debug Log References

### Completion Notes List

- Created `ProjectSwitcher.tsx`: dropdown combobox with project list, keyboard navigation (ArrowUp/Down, Enter, Escape), click-outside-to-close, ARIA attributes (role=combobox, role=listbox, role=option, aria-selected, aria-expanded), i18n support, toast notifications for success/error
- Integrated into `Sidebar.tsx`: replaced static "BMAD Board" header with ProjectSwitcher; supports collapsed/expanded modes via `collapsed` prop; collapse toggle preserved with aria-label
- Added 7 i18n keys to both RU and EN dictionaries: `projectSwitcher.title`, `projectSwitcher.switchProject`, `projectSwitcher.currentProject`, `projectSwitcher.noProjects`, `projectSwitcher.switching`, `toast.projectSwitched`, `toast.projectSwitchError`
- Created 19 unit tests in `ProjectSwitcher.test.tsx` covering: rendering, dropdown open/close, project switching, toast success/error, active project aria-selected, keyboard navigation, click outside, ARIA attributes
- All 160 tests pass (14 test files), lint passes with zero TypeScript errors
- Followed project conventions: `@/*` path alias, design tokens only (no hardcoded colors), `'use client'` directive, no new dependencies, no changes to main process or IPC channels, StoreManager used for switching (no direct store mutations)

### File List

- `src/renderer/components/ProjectSwitcher.tsx` — new: dropdown component for switching projects
- `src/renderer/components/ProjectSwitcher.test.tsx` — new: Vitest tests for project switcher
- `src/renderer/components/Sidebar.tsx` — update: integrate ProjectSwitcher into header
- `src/renderer/lib/i18n.tsx` — update: add project switcher and toast keys

## Story Completion Status

- [x] Task 1: Create ProjectSwitcher component
- [x] Task 2: Integrate into Sidebar
- [x] Task 3: Add i18n keys
- [x] Task 4: Write tests
- [x] Task 5: Final verification

Status: done

### Review Findings

- [x] [Review][Decision] Trigger `aria-label` contradicts AC 5 requirement (`aria-label="Project switcher"`) vs AC 6 i18n key (`projectSwitcher.title` → "Projects" / "Проекты") — **RESOLVED**: add new i18n key `projectSwitcher.ariaLabel` → "Project switcher" / "Переключатель проектов"
- [x] [Review][Patch] Add `projectSwitcher.ariaLabel` i18n key and use it for trigger button `aria-label` [ProjectSwitcher.tsx:176, i18n.tsx] — fixed

- [x] [Review][Patch] Collapsed sidebar layout forces ProjectSwitcher button to overflow its container [Sidebar.tsx:123] — fixed: conditional padding `px-1` in collapsed mode
- [x] [Review][Patch] Test `opens dropdown on ArrowDown when closed` contains unreachable assertions due to premature `return` [ProjectSwitcher.test.tsx:232] — not reproducible in current file; likely already fixed or diff artifact
- [x] [Review][Patch] `fetchProjects` can call `setProjects` on unmounted component and lacks in-flight request deduplication [ProjectSwitcher.tsx:46-65] — fixed: added `mountedRef` and `pendingRef` for guard and dedup
- [x] [Review][Patch] `fetchProjects` silently swallows all errors and wipes the visible project list [ProjectSwitcher.tsx:57-60] — fixed: errors logged to console instead of clearing list
- [x] [Review][Patch] Selecting already-active project triggers unnecessary full store reload [ProjectSwitcher.tsx:116-120] — fixed: guard in `handleSelect` closes dropdown and returns early
- [x] [Review][Patch] `formatLastUsed` produces misleading output for invalid and future ISO strings [ProjectSwitcher.tsx:10-21] — fixed: added `Number.isNaN` check and `diffMs < 0` guard
- [x] [Review][Patch] Enter key on trigger button while dropdown is open selects first project accidentally [ProjectSwitcher.tsx:152-156] — fixed: skip selection when `e.target === buttonRef.current`
- [x] [Review][Patch] Focus not moved to list items when async fetch populates initially empty dropdown; test flakiness risk [ProjectSwitcher.tsx:109-112, ProjectSwitcher.test.tsx:261-264] — fixed: added `useEffect` watching `projects` to set `focusedIndex` when list populates; test waits for `tabIndex="0"`
- [x] [Review][Patch] Trigger shows "No projects" when active project is missing from fetched list [ProjectSwitcher.tsx:188-190] — fixed: only show "No projects" when `projects.length === 0`
- [x] [Review][Patch] Relative `../../` import violates project path-alias constraint [ProjectSwitcher.tsx:7, ProjectSwitcher.test.tsx:9] — attempted `@/shared/ipc-channels` but tsconfig paths map `@/*` to `src/renderer/*`; reverted to `../../shared/ipc-channels` as the only valid resolution

- [x] [Review][Defer] `storeManager._doSwitch` can leave the Zustand store permanently empty when a newer switch supersedes an in-flight one [store-manager.ts:114-116] — deferred, pre-existing issue in StoreManager not caused by this change

Ultimate context engine analysis completed - comprehensive developer guide created
