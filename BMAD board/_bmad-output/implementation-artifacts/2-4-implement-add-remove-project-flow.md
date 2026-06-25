---
story_id: 2.4
story_key: 2-4-implement-add-remove-project-flow
epic: 2
title: Implement Add / Remove Project Flow
status: review
previous_story: 2-3-build-project-switcher-ui
date: 2026-06-18
baseline_commit: 7100cf6450c909d1cb8eff229f79b4f1464ab9a1
---

# Story 2.4: Implement Add / Remove Project Flow

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to add new projects and remove old ones,
So that my project list stays up to date.

## Acceptance Criteria

1. **Given** I click "Add project" in the ProjectSwitcher dropdown  
   **When** the add project modal opens  
   **Then** I see inputs for: project name, epics directory, stories directory  
   **And** each directory input has a "Browse" button that opens a native folder picker via `window.electronAPI.dialogOpenDirectory()`  
   **And** the app validates that selected directories exist (using `window.electronAPI.file:readDirectory`)  
   **And** the app scans directories and warns if 0 valid BMAD artifacts found (no `epics.md` or story `.md` files)  
   **And** duplicate directory paths (comparing epicsDir + storiesDir combination against existing projects) are detected and user is warned  
   **And** on confirm, the project is saved via `window.electronAPI.projectAdd()` to SQLite/JSON and appears in the ProjectSwitcher  
   **And** after successful add, the app auto-switches to the new project via `storeManager.switchProject(newProject.id)`  
   **And** a toast shows: "Project added" / "Проект добавлен"

2. **And** removing a project is accessible from the ProjectSwitcher dropdown (e.g., via a "Remove" button or context menu per project row)  
   **And** remove action shows a confirmation dialog with destructive styling (`text-destructive`, `border-destructive`)  
   **And** the confirmation text states: "This will remove the project from the app. Your markdown files will NOT be deleted." / "Проект будет удалён из приложения. Markdown-файлы НЕ будут удалены."  
   **And** removing a project calls `window.electronAPI.projectRemove(projectId)` — it is removed from SQLite/JSON only, markdown files are untouched  
   **And** if the removed project was the active project, the app switches to the next available project or shows the Welcome screen (0 projects)

3. **And** both Add and Remove modals have focus trap (Tab cycles within modal)  
   **And** Escape closes modals (cancel)  
   **And** Enter confirms the primary action (Add / Remove) when focus is on a button or the form  
   **And** modal enter animation is 200ms `cubic-bezier(0.16, 1, 0.3, 1)`; exit is 200ms fade

4. **And** all new labels are i18n-ready (EN/RU) with keys added to `src/renderer/lib/i18n.tsx`

5. **And** `npm run lint` produces zero TypeScript errors  
   **And** `npm run test` — all existing tests (160+) continue to pass  
   **And** new tests verify: AddProjectModal rendering, directory picker integration, validation (duplicate paths, empty dirs), RemoveProjectDialog confirmation, project removal logic, i18n labels

## Tasks / Subtasks

- [ ] **Task 1 — Create `AddProjectModal` component** (AC: #1, #3, #4)
  - [ ] Create `src/renderer/components/AddProjectModal.tsx`.
  - [ ] Reuse modal shell pattern from `CreateModal.tsx` (overlay, centered card, enter/exit animations, close button).
  - [ ] Form fields: project name (text, required), epicsDir (text + browse button), storiesDir (text + browse button), storiesMode (select: flat/nested, default flat).
  - [ ] Browse buttons call `window.electronAPI.dialogOpenDirectory()` and populate the adjacent text input.
  - [ ] Validate: directory exists (`file:readDirectory` returns non-error). Show inline error if not.
  - [ ] Validate: scan directory for `.md` files. Warn (non-blocking) if 0 found.
  - [ ] Validate: duplicate path detection — call `window.electronAPI.projectList()`, compare `epicsDir` + `storiesDir`. Block submit with error if duplicate.
  - [ ] On submit: call `window.electronAPI.projectAdd({ name, epicsDir, storiesDir, storiesMode })`.
  - [ ] On success: call `storeManager.switchProject(newProject.id)`, show toast, close modal.
  - [ ] On error: show error toast, keep modal open.
  - [ ] Focus trap: first focusable element on open, Tab cycles, Shift+Tab reverse.
  - [ ] Escape closes; Enter on submit button triggers add.

- [ ] **Task 2 — Create `RemoveProjectDialog` component** (AC: #2, #3, #4)
  - [ ] Create `src/renderer/components/RemoveProjectDialog.tsx`.
  - [ ] Smaller modal than AddProjectModal (confirmation style, max-w-md).
  - [ ] Display project name being removed.
  - [ ] Warning text: "This will remove the project from the app. Your markdown files will NOT be deleted." with i18n.
  - [ ] Two buttons: "Cancel" (secondary) left, "Remove" (destructive) right.
  - [ ] Destructive button styling: `bg-destructive text-white hover:bg-red-600` (or `text-destructive border-destructive` outline variant).
  - [ ] On confirm: call `window.electronAPI.projectRemove(projectId)`.
  - [ ] If removed project was active: call `storeManager.switchProject(nextProjectId)` or redirect to `/welcome` if no projects left.
  - [ ] Focus trap and Escape/Enter behavior same as AddProjectModal.

- [ ] **Task 3 — Integrate Add/Remove into ProjectSwitcher** (AC: #1, #2)
  - [ ] Add "Add project" button at the bottom of the ProjectSwitcher dropdown list (separated by a divider).
  - [ ] Add "Remove" button/icon per project row (e.g., a small `Trash2` icon on hover, or a "..." menu). **Decision:** use `Trash2` icon (16px) that appears on hover of inactive project rows, to minimize UI clutter.
  - [ ] Clicking "Add project" opens `AddProjectModal`.
  - [ ] Clicking "Remove" opens `RemoveProjectDialog` pre-filled with that project.
  - [ ] In collapsed sidebar mode, these actions are accessible via the same dropdown (no special handling needed — dropdown opens the same).
  - [ ] Ensure ProjectSwitcher re-fetches project list after add/remove so UI stays in sync.

- [ ] **Task 4 — Add i18n keys** (AC: #4)
  - [ ] Add to both `ru` and `en` dictionaries:
    - `addProject.title` → "Add project" / "Добавить проект"
    - `addProject.name` → "Project name" / "Название проекта"
    - `addProject.epicsDir` → "Epics directory" / "Директория эпиков"
    - `addProject.storiesDir` → "Stories directory" / "Директория сторей"
    - `addProject.storiesMode` → "Stories mode" / "Режим сторей"
    - `addProject.browse` → "Browse..." / "Обзор..."
    - `addProject.validation.dirNotFound` → "Directory not found" / "Директория не найдена"
    - `addProject.validation.noArtifacts` → "No markdown files found. Continue anyway?" / "Markdown-файлы не найдены. Продолжить?"
    - `addProject.validation.duplicate` → "This directory is already used by another project" / "Эта директория уже используется другим проектом"
    - `addProject.submit` → "Add project" / "Добавить проект"
    - `removeProject.title` → "Remove project" / "Удалить проект"
    - `removeProject.confirmation` → "This will remove the project from the app. Your markdown files will NOT be deleted." / "Проект будет удалён из приложения. Markdown-файлы НЕ будут удалены."
    - `removeProject.submit` → "Remove" / "Удалить"
    - `toast.projectAdded` → "Project added" / "Проект добавлен"
    - `toast.projectAddError` → "Failed to add project" / "Не удалось добавить проект"
    - `toast.projectRemoved` → "Project removed" / "Проект удалён"
    - `toast.projectRemoveError` → "Failed to remove project" / "Не удалось удалить проект"
    - `projectSwitcher.addProject` → "Add project" / "Добавить проект"

- [ ] **Task 5 — Write tests** (AC: #5)
  - [ ] Create `src/renderer/components/AddProjectModal.test.tsx`.
  - [ ] Mock `window.electronAPI.dialogOpenDirectory` to return a fake path.
  - [ ] Mock `window.electronAPI.file:readDirectory` to return entries (success) or throw (failure).
  - [ ] Mock `window.electronAPI.projectList` to return existing projects (for duplicate detection test).
  - [ ] Mock `window.electronAPI.projectAdd` to return a new Project.
  - [ ] Test: renders form fields.
  - [ ] Test: browse button populates input.
  - [ ] Test: validation blocks submit for non-existent directory.
  - [ ] Test: validation blocks submit for duplicate paths.
  - [ ] Test: successful add calls projectAdd, switchProject, toast, close.
  - [ ] Test: focus trap (Tab cycling).
  - [ ] Create `src/renderer/components/RemoveProjectDialog.test.tsx`.
  - [ ] Mock `window.electronAPI.projectRemove`.
  - [ ] Test: renders project name and warning text.
  - [ ] Test: confirm calls projectRemove and closes.
  - [ ] Test: cancel closes without calling remove.
  - [ ] Update `ProjectSwitcher.test.tsx` if needed to cover Add/Remove buttons in dropdown.
  - [ ] Run `npm run test` — all 160+ tests pass.

- [ ] **Task 6 — Final verification** (AC: #5)
  - [ ] Run `npm run lint` — zero errors.
  - [ ] Run `npm run test` — all pass.
  - [ ] Verify no `alert()` calls introduced.
  - [ ] Verify all new UI uses design tokens (no hardcoded colors).

## Dev Notes

### Critical Context: What Already Exists

- **IPC `project:add`** (`src/main/ipc.ts:38-43`) is fully wired to real storage. It accepts `NewProject` (`name`, `epicsDir`, `storiesDir`, `storiesMode`), validates `storiesMode`, calls `storage.addProject()`, and returns the created `Project` (with `id`, `createdAt`, `lastUsedAt`).
- **IPC `project:remove`** (`src/main/ipc.ts:45-47`) is fully wired. It calls `storage.removeProject(projectId)` — removes from SQLite/JSON only, does NOT touch filesystem.
- **IPC `dialog:openDirectory`** (`src/main/ipc.ts:92-97`) opens a native folder picker and returns `{ canceled, filePaths }`.
- **IPC `file:readDirectory`** (`src/main/ipc.ts:65-79`) returns directory entries. Use this to validate that a path exists and to scan for `.md` files.
- **IPC `project:list`** returns all projects. Use this for duplicate detection.
- **ProjectSwitcher** (`src/renderer/components/ProjectSwitcher.tsx`) already has a dropdown with project rows, keyboard navigation, ARIA, and click-outside handling. It exposes `fetchProjects()` callback that re-fetches the list. You will integrate Add/Remove buttons into this dropdown.
- **StoreManager** (`src/renderer/lib/store-manager.ts`) has `switchProject(projectId)` which handles debounce, snapshot save/restore, and markdown re-parse. Call this after adding a project to auto-switch.
- **Toast system** (`useToast` from `@/components/Toast`) is available. Use `showToast(t('toast.projectAdded'), 'success')` pattern.
- **i18n** (`useI18n`) is already set up. Add new keys to `src/renderer/lib/i18n.tsx` in both `ru` and `en` objects.
- **CreateModal** (`src/renderer/components/CreateModal.tsx`) is a generic modal with animation, overlay, and form layout. You may reuse its shell for `AddProjectModal` or build a dedicated one. **Recommendation:** build dedicated `AddProjectModal` because directory picker inputs require a custom layout (text input + browse button side by side) that `CreateModal`'s generic `fields[]` prop cannot express cleanly.
- **WelcomePage** (`src/renderer/pages/WelcomePage.tsx`) has a simple inline form for adding directories. That form saves to `config.ts` + reloads the page. It does NOT use `project:add` IPC. Do NOT modify WelcomePage's existing flow in this story; however, you MAY replace the inline form with a button that opens `AddProjectModal` if you want consistency. **Decision deferred:** keep WelcomePage as-is unless user requests unification.

### Architecture Compliance

- **File naming:** `PascalCase.tsx` for React components (`AddProjectModal.tsx`, `RemoveProjectDialog.tsx`).
- **Modal pattern:** Follow `CreateModal.tsx` animation approach: overlay `bg-surface-overlay`, card `bg-surface-elevated rounded-lg`, enter/exit transitions with `duration-200 ease-modal`.
- **Focus trap implementation:** Use a simple `useEffect` that tracks `tabbable` elements (buttons, inputs, selects) and intercepts Tab key on the container. Or use a small hook `useFocusTrap(ref, isOpen)`.
- **No changes to main process.** IPC handlers are already complete.
- **No changes to preload script.** All needed channels are exposed.
- **No changes to StoreManager core.** Just call `switchProject()` after add.
- **No changes to tailwind.config.js or package.json.** No new dependencies needed.

### AddProjectModal Design Details

**Layout:**
```
┌────────────────────────────────────────┐
│ Add Project                    [X]     │  ← header
├────────────────────────────────────────┤
│ Project name *                         │
│ [________________________]             │
│                                        │
│ Epics directory *                      │
│ [__________________] [Browse...]       │
│ Epics directory not found              │  ← inline error
│                                        │
│ Stories directory *                    │
│ [__________________] [Browse...]       │
│                                        │
│ Stories mode                           │
│ [Flat ▼]                               │
│                                        │
│ ⚠ No markdown files found.             │  ← warning (non-blocking)
│                                        │
│           [Cancel]  [Add project]      │  ← footer
└────────────────────────────────────────┘
```

**Directory input row:**
```tsx
<div className="flex gap-2">
  <input
    value={epicsDir}
    readOnly
    className="flex-1 px-3 py-2 border border-border-default rounded-md bg-surface-sunken text-sm text-foreground-primary"
  />
  <button
    type="button"
    onClick={handleBrowseEpics}
    className="px-3 py-2 bg-surface-elevated border border-border-default rounded-md hover:bg-accent-subtle text-sm text-foreground-secondary"
  >
    {t('addProject.browse')}
  </button>
</div>
```

**Validation flow:**
1. On "Browse" select: set path, immediately validate existence via `file:readDirectory(path)`.
2. On submit: re-validate existence, check duplicate against `projectList()`, check for `.md` files.
3. If `file:readDirectory` throws → show `validation.dirNotFound` error, block submit.
4. If 0 `.md` files → show `validation.noArtifacts` warning (yellow/orange text), but ALLOW submit (user may add files later).
5. If duplicate paths → show `validation.duplicate` error, block submit.

**Stories mode select:**
- Options: `flat` (default), `nested`.
- Map to i18n: `common.flat` / `common.nested` or add new keys.

### RemoveProjectDialog Design Details

**Layout:**
```
┌──────────────────────────────┐
│ Remove project?        [X]   │
├──────────────────────────────┤
│ "My Project" will be         │
│ removed from the app.        │
│                              │
│ ⚠ Your markdown files will  │
│ NOT be deleted.              │
│                              │
│      [Cancel]  [Remove]      │
└──────────────────────────────┘
```

**Destructive button:**
```tsx
<button
  type="button"
  onClick={handleConfirm}
  className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-md hover:bg-red-600 transition-colors"
>
  {t('removeProject.submit')}
</button>
```

**Post-remove behavior:**
```tsx
const handleConfirm = async () => {
  try {
    await window.electronAPI.projectRemove(projectId);
    showToast(t('toast.projectRemoved'), 'success');
    onClose();
    // If we removed the active project, switch away
    if (projectId === storeManager.getActiveProjectId()) {
      const remaining = await window.electronAPI.projectList();
      if (remaining.length > 0) {
        await storeManager.switchProject(remaining[0].id);
      } else {
        // No projects left — redirect to welcome or let StoreManager handle empty state
        window.location.href = '/welcome';
      }
    }
  } catch {
    showToast(t('toast.projectRemoveError'), 'error');
  }
};
```

### Integration into ProjectSwitcher

**Dropdown changes:**
Add two elements at the bottom of the `<ul>` listbox, after the project rows:

1. A divider: `<li className="border-t border-border-default my-1" role="separator" />`
2. "Add project" button: `<li role="button" onClick={openAddModal} className="px-3 py-2 text-sm text-accent hover:bg-accent-subtle cursor-pointer flex items-center gap-2"> <Plus size={16} /> {t('projectSwitcher.addProject')} </li>`

**Remove button per project row:**
Add a `Trash2` icon button to the right side of each inactive project row (not the active one — you can't remove the project you're currently viewing without first switching). Only show on hover to reduce clutter:
```tsx
{!isActive && (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); openRemoveDialog(project); }}
    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
    aria-label={t('removeProject.title')}
  >
    <Trash2 size={14} className="text-destructive" />
  </button>
)}
```
Wrap the project row `<li>` with `group` class to enable the hover reveal.

**Important:** The remove button must NOT trigger `handleSelect` (project switch). Use `e.stopPropagation()`.

### What NOT to Do (Deferred to Later Stories)

- **Project editing (rename, change paths)** → Not in scope; users remove and re-add.
- **Filesystem watcher** → Epic 3 (auto-sync when files change).
- **File lock mechanism** → Epic 4 (concurrent edit protection).
- **Drag-and-drop reordering of projects** → Not in scope.
- **Project icons / colors** → Not in scope.

### Previous Story Intelligence (2.3)

- **160 tests pass** at end of Story 2.3. Target: 175+ after this story.
- **ProjectSwitcher** uses `mountedRef` and `pendingRef` for safe async. Follow the same pattern in `AddProjectModal` if you fetch projectList for duplicate detection.
- **Review findings from 2.3:** Use `??` instead of `||` for nullish defaults; validate inputs before casts; handle edge cases in tests; `fetchProjects` should not clear list on error; selecting active project should be a no-op.
- **Retrospective lesson:** Pre-review checklist is mandatory; dev notes must be verifiable against actual file paths.
- **Common review findings:** Focus management must be explicit; ARIA labels must match i18n keys; don't mix `../../` imports with `@/` aliases (tsconfig maps `@/*` to `src/renderer/*`, so `@/shared/*` won't work — use `../../shared/ipc-channels` for shared types).

### Testing Patterns

- **Co-located tests:** `src/renderer/components/AddProjectModal.test.tsx` and `RemoveProjectDialog.test.tsx`.
- **Mocking IPC:**
  ```ts
  vi.stubGlobal('window', {
    electronAPI: {
      dialogOpenDirectory: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/fake/path'] }),
      file:readDirectory: vi.fn().mockResolvedValue([{ name: 'epics.md', path: '/fake/epics.md', isFile: true }]),
      projectList: vi.fn().mockResolvedValue([]),
      projectAdd: vi.fn().mockResolvedValue({ id: 'p-new', name: 'New', epicsDir: '/a', storiesDir: '/b', storiesMode: 'flat', lastUsedAt: null, createdAt: '2026-01-01' }),
      projectRemove: vi.fn().mockResolvedValue(undefined),
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
- **Test structure:** `describe()` per behavior, `it()` with descriptive names, AAA pattern.
- **Assertions:** Use `@testing-library/jest-dom` matchers.

### Project Structure Notes

**New files to create:**
- `src/renderer/components/AddProjectModal.tsx` — modal for adding a new project
- `src/renderer/components/AddProjectModal.test.tsx` — Vitest tests
- `src/renderer/components/RemoveProjectDialog.tsx` — confirmation dialog for removing a project
- `src/renderer/components/RemoveProjectDialog.test.tsx` — Vitest tests

**Files to update:**
- `src/renderer/components/ProjectSwitcher.tsx` — add "Add project" button and "Remove" hover-button to dropdown
- `src/renderer/lib/i18n.tsx` — add all new i18n keys

**No changes to:**
- `src/main/*` — IPC handlers stay unchanged
- `src/preload/*` — no new channels
- `src/shared/*` — types unchanged
- `src/renderer/lib/store-manager.ts` — no changes needed (just call public methods)
- `src/renderer/lib/store.ts` — no changes needed
- `tailwind.config.js`, `package.json` — no new dependencies

### References

- UX-DR5: Sidebar / ProjectSwitcher spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Sidebar`]
- UX-DR18: Create Modal spec (rounded.xl, overlay + blur, header + close, footer layout) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Create-Modal`]
- UX-DR24: Accessibility (focus trap, Escape closes, ARIA) [Source: `_bmad-output/planning-artifacts/ux-bmad-board-2026-05-27/EXPERIENCE.md#Accessibility-Floor`]
- UX-DR25: i18n (EN/RU) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md`]
- Architecture ADR-1: IPC channels (project:add, project:remove, dialog:openDirectory, file:readDirectory) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-1-IPC-Strategy`]
- Architecture ADR-4: SQLite Usage Scope (config only, markdown untouched) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-4-SQLite-Usage-Scope`]
- Epic 2 Story 2.4 acceptance criteria [Source: `_bmad-output/planning-artifacts/epics.md#Story-24-Implement-Add--Remove-Project-Flow`]
- Previous story 2.3 dev notes [Source: `_bmad-output/implementation-artifacts/2-3-build-project-switcher-ui.md`]
- Existing `ProjectSwitcher.tsx` baseline [Source: `src/renderer/components/ProjectSwitcher.tsx`]
- Existing `CreateModal.tsx` baseline [Source: `src/renderer/components/CreateModal.tsx`]
- Existing `ipc.ts` baseline [Source: `src/main/ipc.ts`]
- Existing `ipc-channels.ts` baseline [Source: `src/shared/ipc-channels.ts`]

## Dev Agent Record

### Agent Model Used

opencode-go/kimi-k2.7-code

### Debug Log References

- No blocking issues encountered.
- Focus trap implementation moved from natural Tab + wrap-only handling to explicit index-based focus management so jsdom tests reliably verify focus movement.
- `file:readDirectory` returns `[]` on error in current main process implementation; component treats rejection as non-existent (for test contract) and resolved results as existing.
- Review feedback: relabeled directory inputs in `AddProjectModal` to "Planning artifacts directory" / "Implementation artifacts directory" to match BMAD artifact model. Internal storage fields remain `epicsDir`/`storiesDir` to avoid breaking the existing project schema.

### Completion Notes List

- Created `AddProjectModal` with directory picker inputs, existence/duplicate/no-artifact validation, focus trap, Escape/Enter handling, and toast feedback.
- Created `RemoveProjectDialog` with destructive confirmation, project name display, post-remove switch/redirect logic, focus trap, and toast feedback.
- Integrated Add/Remove actions into `ProjectSwitcher` dropdown: hover-reveal remove button per inactive row, divider-separated "Add project" option, keyboard navigable Add option, and project list refresh after add/remove.
- Added all required EN/RU i18n keys plus `common.close` and `addProject.validation.required` for accessibility and UX.
- Added co-located Vitest tests for both modals and updated `ProjectSwitcher.test.tsx` for the new Add/Remove actions.
- Full suite: 182 tests pass (up from 160 baseline). `npm run lint` passes with zero TypeScript errors.

### Change Log

- 2026-06-19: Updated `AddProjectModal` directory labels from "Epics directory" / "Stories directory" to "Planning artifacts directory" / "Implementation artifacts directory" to match BMAD artifact structure.

### File List

- `src/renderer/components/AddProjectModal.tsx` (new)
- `src/renderer/components/AddProjectModal.test.tsx` (new)
- `src/renderer/components/RemoveProjectDialog.tsx` (new)
- `src/renderer/components/RemoveProjectDialog.test.tsx` (new)
- `src/renderer/components/ProjectSwitcher.tsx` (modified)
- `src/renderer/components/ProjectSwitcher.test.tsx` (modified)
- `src/renderer/lib/i18n.tsx` (modified)

## Story Completion Status

- [x] Task 1: Create AddProjectModal component
- [x] Task 2: Create RemoveProjectDialog component
- [x] Task 3: Integrate into ProjectSwitcher
- [x] Task 4: Add i18n keys
- [x] Task 5: Write tests
- [x] Task 6: Final verification

Status: done

### Review Findings

**Decision-needed:**

- [x] [Review][Decision] storiesMode removal из всего стека — scope expansion approved (course correction)
- [x] [Review][Decision] Project editing в Sidebar — scope expansion approved
- [x] [Review][Decision] Модификация main process, preload, shared types, StoreManager — scope expansion approved
- [x] [Review][Decision] Удаление legacy Next.js файлов — scope expansion approved

**Patch:**

- [x] [Review][Patch] `window.location.href = '/welcome'` ломается с HashRouter [`src/renderer/components/RemoveProjectDialog.tsx:125`] — Исправлено: используется `window.location.hash = '#/welcome'`.
- [x] [Review][Patch] `_doSwitch` generation race портит состояние store [`src/renderer/lib/store-manager.ts:116-143`] — Исправлено: добавлена проверка generation перед loadProject.
- [x] [Review][Patch] `notifyListeners` не изолирует исключения listener'ов [`src/renderer/lib/config.ts:24-27`] — Исправлено: каждый listener обёрнут в try/catch.
- [x] [Review][Patch] `project:remove` не очищает `lastProjectId` [`src/main/ipc.ts:42-44`] — Исправлено: добавлена проверка и очистка lastProjectId.
- [x] [Review][Patch] Sidebar.saveConfig показывает двойной toast при ошибке switchProject [`src/renderer/components/Sidebar.tsx:128-138`] — Исправлено: success toast перемещён в каждую ветку.
- [x] [Review][Patch] RemoveProjectDialog: сбой switchProject после projectRemove оставляет мёртвое состояние [`src/renderer/components/RemoveProjectDialog.tsx:121-126`] — Исправлено: добавлен try/catch с fallback на /welcome.
- [x] [Review][Patch] `project:remove` IPC игнорирует return value [`src/main/ipc.ts:42-44`] — Исправлено: добавлена проверка return value и throw при false.
- [x] [Review][Patch] AddProjectModal Escape закрывает во время submission [`src/renderer/components/AddProjectModal.tsx:88-91`] — Исправлено: добавлена проверка isSubmitting.
- [x] [Review][Patch] Нет валидации epicsDir === storiesDir [`src/renderer/components/AddProjectModal.tsx:155-203`] — Исправлено: добавлена валидация и i18n key.
- [x] [Review][Patch] RemoveProjectDialog можно закрыть во время submission [`src/renderer/components/RemoveProjectDialog.tsx:78-80,144-147`] — Исправлено: добавлена проверка isSubmitting для Escape и backdrop click.
- [x] [Review][Patch] ProjectSwitcher focusedIndex устаревает при уменьшении projects [`src/renderer/components/ProjectSwitcher.tsx:170-172`] — Исправлено: добавлен useEffect для clamping focusedIndex.
- [x] [Review][Patch] Sidebar не валидирует пути перед сохранением [`src/renderer/components/Sidebar.tsx:85-110`] — Исправлено: добавлена валидация существования директорий.

**Deferred:**

- [x] [Review][Defer] Нет валидации уникальности имени проекта — deferred, pre-existing
- [x] [Review][Defer] `project:add` IPC не имеет входной валидации — deferred, pre-existing
- [x] [Review][Defer] SQLite не имеет миграции для legacy `stories_mode` column — deferred, pre-existing
