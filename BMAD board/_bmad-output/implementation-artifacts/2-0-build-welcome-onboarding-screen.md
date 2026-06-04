---
story_id: 2.0
story_key: 2-0-build-welcome-onboarding-screen
epic: 2
title: Build Welcome / Onboarding Screen
status: done
baseline_commit: 83190f10dcaf1328f31b262c03d1e1913180ecb0
date: 2026-06-04
---

# Story 2.0: Build Welcome / Onboarding Screen

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a new user,
I want guidance on how to start using BMAD Board,
so that I know what to do when I have no markdown files yet.

## Acceptance Criteria

1. **Given** the app launches with 0 epics and 0 stories in the store  
   **When** initialization completes  
   **Then** the user is automatically redirected to `/welcome`  
   **And** the Welcome screen renders as a full-page onboarding experience within the standard `Layout` (sidebar visible).

2. **And** the Welcome screen displays the localized title: "Welcome to BMAD Board" / "Добро пожаловать в BMAD Board" in `text-display` typography (30px/700).

3. **And** it displays 3 numbered steps, each with a Lucide icon (48px inside a tinted `rounded.lg` container), a step title in `text-h3`, and a brief description in `text-body-sm`:
   - Step 1: `Sparkles` icon — "Run BMAD AI agents" / "Запустите BMAD AI-агентов" — "Generate markdown artifacts (epics, stories, tasks) using the BMAD Method." / "Создайте markdown-артефакты (эпики, стори, задачи) с помощью BMAD Method."
   - Step 2: `FolderOpen` icon — "Add Project" / "Добавьте проект" — "Select your epics and stories directories to load them into the board." / "Выберите директории с эпиками и сторями для загрузки в доску."
   - Step 3: `LayoutDashboard` icon — "View Your Board" / "Откройте доску" — "Explore your dashboard, sprint board, backlog, and documents." / "Изучите дашборд, доску спринта, бэклог и документы."

4. **And** a prominent "Add Project" primary button (`rounded.md`, `bg-accent`, `text-foreground-on-accent`, hover `bg-accent-hover`, active `scale(0.98)` 80ms) is visible below the steps.
   - Clicking the button opens an inline config form (or a modal) with two directory inputs: "Epics directory" and "Stories directory".
   - Each input has a browse-folder button using the existing `window.electronAPI.dialogOpenDirectory()` IPC call.
   - A "Save & Load" button saves the config via the existing `config.ts` + `window.electronAPI.configWrite()` pattern and triggers `window.location.reload()` to re-initialize the store.
   - The form follows the same visual patterns as the existing sidebar settings panel (border-default, surface-elevated inputs, focus rings).

5. **And** the Welcome screen is fully accessible:
   - Tab navigation moves through all interactive elements in logical order.
   - All buttons and inputs have visible `:focus-visible` rings (2px accent outline, 1px offset) via the existing global rule in `index.css`.
   - Step icons have `aria-hidden="true"`; step text is readable by screen readers.
   - The "Add Project" button has an `aria-label` that includes its action.

6. **And** all new UI text is i18n-ready with keys added to both `ru` and `en` dictionaries in `src/renderer/lib/i18n.tsx`.

7. **And** once the store contains at least 1 epic or 1 story after reload, the app no longer auto-redirects to `/welcome`; the user sees the Dashboard.

8. **And** a "Help" (`CircleHelp` Lucide icon) nav item is added to the sidebar above the footer divider.
   - It links to `/welcome`.
   - It is always visible regardless of data state.
   - In collapsed sidebar mode, only the icon is shown with a tooltip (`title` attribute).
   - It uses the same active/hover styles as other nav items.

9. **And** a `WelcomePage.test.tsx` Vitest test verifies:
   - WelcomePage renders with the 3 steps and Add Project button.
   - Conditional redirect logic: when store has 0 epics/stories, DashboardPage redirects to `/welcome`.
   - Help nav item renders in Sidebar.
   - All existing tests continue to pass (55+).

## Tasks / Subtasks

- [x] **Task 1 — Create `src/renderer/pages/WelcomePage.tsx`** (AC: #2, #3, #4, #5, #6)
  - [x] Create the full-page onboarding component using existing design tokens.
  - [x] Render localized title, 3 steps with Lucide icons in tinted containers, descriptions.
  - [x] Render "Add Project" primary button.
  - [x] Implement inline config form (or modal) with epicsDir + storiesDir inputs, browse buttons, Save & Load button.
  - [x] On Save & Load: call `setConfig({ epicsDir, storiesDir })`, then `window.electronAPI.configWrite(config)`, then `window.location.reload()`.
  - [x] Ensure all interactive elements have proper focus rings and ARIA attributes.
  - [x] Use `useI18n()` for all text.

- [x] **Task 2 — Add `/welcome` route and conditional redirect** (AC: #1, #7)
  - [x] Add `<Route path="welcome" element={<WelcomePage />} />` in `src/renderer/App.tsx`.
  - [x] In `src/renderer/pages/DashboardPage.tsx`, add a redirect: if `initialized && stats.totalEpics === 0 && stats.totalStories === 0`, render `<Navigate to="/welcome" replace />` from `react-router-dom` instead of the dashboard content.
  - [x] Verify the redirect does NOT fire while `initialized === false` (loading state must finish first).

- [x] **Task 3 — Add Help nav item to Sidebar** (AC: #8)
  - [x] Import `CircleHelp` from `lucide-react` in `Sidebar.tsx`.
  - [x] Add a new nav item object to `navItems` array (or add it separately above the footer) with:
    - `key: 'nav.help'`
    - `href: '/welcome'`
    - `icon: <CircleHelp size={18} className="shrink-0" />`
  - [x] Ensure it renders in the nav section (above the footer divider, NOT inside the footer buttons group).
  - [x] Use same active/hover styles as other nav items.

- [x] **Task 4 — Add i18n keys** (AC: #6)
  - [x] Add to both `ru` and `en` dictionaries in `src/renderer/lib/i18n.tsx`:
    - `welcome.title`
    - `welcome.step1.title`, `welcome.step1.description`
    - `welcome.step2.title`, `welcome.step2.description`
    - `welcome.step3.title`, `welcome.step3.description`
    - `welcome.addProject`
    - `welcome.saveAndLoad`
    - `welcome.epicsDir`
    - `welcome.storiesDir`
    - `welcome.browseFolder`
    - `nav.help`

- [x] **Task 5 — Write `WelcomePage.test.tsx`** (AC: #9)
  - [x] Create `src/renderer/pages/WelcomePage.test.tsx`.
  - [x] Test that WelcomePage renders 3 steps, title, and Add Project button.
  - [x] Test that DashboardPage redirects to `/welcome` when store is empty.
  - [x] Test that DashboardPage does NOT redirect when store has data.
  - [x] Run `npm run test` — 62 tests pass (55+).

- [x] **Task 6 — Final verification** (AC: all)
  - [x] Run `npm run lint` — zero TypeScript errors.
  - [x] Run `npm run test` — 62 tests pass.
  - [x] Verify no `alert()` calls introduced.

## Dev Notes

### Critical Context from Previous Work

- **`project-context.md` is STALE** — it describes the old Next.js stack. The actual codebase is **Electron + Vite + React Router v6**. Do NOT follow `project-context.md` for stack or architecture.
- `tailwind.config.js` is **CommonJS** (`module.exports`). Keep that format.
- `@/*` alias resolves to `src/renderer/*` in both Vite and Vitest.
- **55 tests pass** at the end of Epic 5a. This story should bring total to 58+.
- **Context pattern** (not Zustand) is the established pattern for UI-only state (see `Toast.tsx`, `ThemeProvider.tsx`). Welcome screen state (showing form vs steps) can use local `useState`.
- The existing **Zustand store** (`useAppStore`) is a singleton. Do NOT attempt to build `StoreManager` per-project isolation in this story — that is **Story 2.2**.
- The existing **config system** (`src/renderer/lib/config.ts`) already handles `epicsDir`, `storiesDir`, and IPC read/write. Reuse it exactly.
- The existing **markdown parser** (`src/renderer/lib/markdown-parser.ts`) already initializes the store from disk. After saving new paths and reloading, it will parse the new directories automatically.

### Welcome Screen Architecture

**Why redirect from DashboardPage?**
The welcome screen is an **empty-state escalation**. The current `DashboardPage` already shows a basic empty state (`dashboard.noEpics`, `dashboard.orCreateEpic`). The welcome screen is a richer, guided onboarding that should replace the dashboard ONLY when there is truly zero data.

Placing the redirect in `DashboardPage` (the `/` route) is the minimal, cleanest approach:
- No changes to `Layout.tsx` needed.
- `App.tsx` only needs one new route.
- The sidebar remains visible because `Layout` wraps all routes.
- Other routes (`/board`, `/backlog`, etc.) are unreachable when empty because the sidebar nav links go to routes that will also redirect or show empty states — but since the welcome screen auto-redirects from `/`, users will land there first.

**Important:** Do NOT wrap `<Outlet />` in `Layout.tsx` with conditional rendering. That would hide the sidebar, break the "return via sidebar Help" AC, and make the settings-inaccessible. The welcome screen is a page like any other; it just happens to be shown automatically when no data exists.

### Add Project Form — Scope Boundaries

This story builds the **UI shell** for onboarding. The "Add Project" form should:
1. Collect `epicsDir` and `storiesDir` paths.
2. Save them using the **existing** `config.ts` + `window.electronAPI.configWrite()` mechanism.
3. Trigger a page reload so `Providers.tsx` re-initializes the store from the new paths.

Do NOT:
- Validate that directories contain valid BMAD artifacts (Story 2.4).
- Detect duplicate paths (Story 2.4).
- Show a confirmation dialog (Story 2.4).
- Use SQLite (Story 2.1).
- Build a StoreManager (Story 2.2).

The form should reuse the **exact same visual patterns** as the existing sidebar settings panel:
- Inputs: `flex-1 min-w-0 px-2 py-1.5 bg-surface-elevated border border-border-default rounded text-xs text-foreground-primary placeholder-foreground-tertiary focus:border-accent focus:outline-none`
- Browse button: `px-2 py-1.5 bg-surface-elevated border border-border-default rounded hover:bg-accent-subtle transition-colors shrink-0`
- Save button: `flex-1 px-2 py-1.5 bg-accent text-foreground-on-accent text-xs rounded hover:bg-accent-hover transition-colors`

### Sidebar Help Nav Item Placement

Add the Help item **inside the `<nav>` section**, after the existing 6 nav items, but **before** the footer `<div>` that contains settings/sync/language/theme buttons. This keeps functional nav items together and separates them from utility/footer actions.

Use the **same `NavLink` component** and active/hover classes as the existing nav items.

### i18n Key Naming Convention

Follow the existing pattern in `src/renderer/lib/i18n.tsx`:
- Page-specific keys: `welcome.<section>.<element>`
- Nav keys: `nav.<name>`
- Always add to BOTH `ru` and `en` objects.
- Use `useI18n()` hook; do NOT access `translations` object directly.

### Testing Patterns to Follow

- Vitest + `@testing-library/react` (both installed).
- `jsdom` environment is active.
- `setupFiles: ['src/renderer/setupTests.ts']` — `@testing-library/jest-dom/matchers` extended.
- Mock Zustand store state for redirect tests:
  ```ts
  vi.mock('@/lib/store', () => ({
    useAppStore: (selector: any) => selector({
      initialized: true,
      epics: [],
      stories: [],
      getStats: () => ({ totalEpics: 0, totalStories: 0, ... }),
    }),
  }));
  ```
- Use `render` from `@testing-library/react`.
- Use `MemoryRouter` from `react-router-dom` for route-level tests.

### Design Token Compliance

- Background: `bg-surface-base` for the page canvas.
- Card/container for steps: `bg-surface-elevated rounded-lg border border-border-default`.
- Step icon containers: `bg-accent-subtle rounded-lg` (tinted container, 48px icon inside).
- Title: `text-display text-foreground-primary`.
- Step titles: `text-h3 text-foreground-primary`.
- Step descriptions: `text-body-sm text-foreground-secondary`.
- Primary button: `bg-accent text-foreground-on-accent rounded-md hover:bg-accent-hover active:scale-[0.98] transition-transform duration-100`.
- Do NOT use any hardcoded `jira-*` colors or arbitrary hex values. Use CSS custom property tokens exclusively.

### What NOT to Do (Deferred to Later Stories)

- **SQLite project storage** → Story 2.1
- **StoreManager per-project isolation** → Story 2.2
- **Project Switcher UI** → Story 2.3
- **Full Add/Remove Project Flow with validation** → Story 2.4
- **Polished Card hover shadows / Button active states** → Epic 5b-i
- **Shiki/Mermaid rendering** → Epic 5b-ii

### References

- UX-DR5: Sidebar spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Sidebar`]
- UX-DR21: Theme Toggle (footer pattern) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Theme-Toggle`]
- UX-DR24: Accessibility (focus rings, ARIA) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#Accessibility-Floor`]
- Architecture ADR-2: Store Architecture (singleton → per-project in 2.2) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-2-Store-Architecture`]
- Architecture ADR-4: SQLite Usage Scope (config only) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-4-SQLite-Usage-Scope`]
- Architecture ADR-6: API Client Pattern (existing IPC config calls) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-6-Server-vs-No-Embedded-Server`]
- Epic 5a Retrospective: Pre-review checklist is mandatory; dev notes must be verifiable [Source: `_bmad-output/implementation-artifacts/epic-5a-retrospective-2026-06-04.md`]
- Previous story dev notes (5a.4): tailwind.config.js is CommonJS, `@/*` alias, test count=55, Context pattern for UI state [Source: `_bmad-output/implementation-artifacts/5a-4-implement-theme-toggle.md`]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- `src/renderer/pages/WelcomePage.tsx` — new: full-page onboarding screen
- `src/renderer/pages/WelcomePage.test.tsx` — new: Vitest tests for welcome screen and redirect logic
- `src/renderer/App.tsx` — update: add `/welcome` route
- `src/renderer/pages/DashboardPage.tsx` — update: add conditional redirect to `/welcome` when store is empty
- `src/renderer/components/Sidebar.tsx` — update: add Help (`CircleHelp`) nav item linking to `/welcome`
- `src/renderer/lib/i18n.tsx` — update: add `welcome.*` and `nav.help` keys for RU and EN

## Story Completion Status

- [x] Task 1: WelcomePage component created
- [x] Task 2: Route and redirect logic added
- [x] Task 3: Sidebar Help nav item added
- [x] Task 4: i18n keys added
- [x] Task 5: Tests written and passing
- [x] Task 6: Final verification complete

Status: done

Ultimate context engine analysis completed - comprehensive developer guide created

---

## Implementation Notes (2026-06-04)

### Summary
Implemented the Welcome/Onboarding screen for new users with zero data. Key changes:

- **WelcomePage.tsx**: Full-page onboarding with 3 guided steps (Run BMAD AI agents, Add Project, View Your Board), each with Lucide icons in tinted containers. "Add Project" button reveals an inline config form for epics/stories directory paths with native folder picker integration. Uses only CSS design tokens.
- **App.tsx**: Added `/welcome` route under Layout wrapper.
- **DashboardPage.tsx**: Conditional redirect to `/welcome` when `initialized && totalEpics === 0 && totalStories === 0`.
- **Sidebar.tsx**: Added CircleHelp nav item linking to `/welcome`, placed above the footer divider.
- **i18n.tsx**: 10 new keys added to both `ru` and `en` dictionaries.
- **Tests**: 7 new tests (WelcomePage rendering, form toggle, redirect logic) — 62 total tests pass. Zero TypeScript errors.

## Review Findings

### decision-needed

(none)

### patch

- [x] [Review][Patch] Save & Load handler bypasses config.ts setConfig utility [WelcomePage.tsx:handleSave] — fixed: now uses setConfig + getConfig
- [x] [Review][Patch] Active-scale transition duration is 100ms instead of specified 80ms [WelcomePage.tsx:button] — fixed: changed to duration-[80ms]
- [x] [Review][Patch] Sidebar Help nav item uses manual pathname check instead of NavLink isActive [Sidebar.tsx] — fixed: uses NavLink className callback
- [x] [Review][Patch] Missing test coverage for Help nav item rendering in Sidebar [WelcomePage.test.tsx] — fixed: added Sidebar test in WelcomePage.test.tsx
- [x] [Review][Patch] Hardcoded fallback paths and extra config fields in Save handler [WelcomePage.tsx:handleSave] — fixed: resolved by setConfig + getConfig
- [x] [Review][Patch] WelcomePage missing bg-surface-base page canvas design token [WelcomePage.tsx] — fixed: added bg-surface-base

### defer

- [x] [Review][Defer] Save error handling provides no user feedback [WelcomePage.tsx:catch] — deferred, not required by AC
- [x] [Review][Defer] Config form not wrapped in <form> element [WelcomePage.tsx] — deferred, pre-existing UX gap
