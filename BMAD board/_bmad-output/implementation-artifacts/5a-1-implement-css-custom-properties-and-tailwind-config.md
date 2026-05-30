---
baseline_commit: c59d01981c5efb18b32851b1ed58a3c422c87502
---

# Story 5a.1: Implement CSS Custom Properties and Tailwind Config

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want all design tokens as CSS custom properties mapped in Tailwind,
so that components can use theme-aware colors, surfaces, and borders.

## Acceptance Criteria

1. **Given** the application is running **When** I inspect any component **Then** colors come from CSS variables (e.g., `bg-[var(--color-surface-elevated)]` or the mapped utility `bg-surface-elevated`).
2. **And** `design-tokens.css` defines all 50+ light/dark pairs for: surface hierarchy, foreground levels, accent (teal), borders, status palette, priority palette, code blocks, destructive.
3. **And** `tailwind.config.js` maps custom properties to utilities: `surface`, `foreground`, `accent`, `border`, `status`, `priority`, `code`.
4. **And** `darkMode: 'class'` strategy is enabled; toggling the `dark` class on `<html>` switches all tokens.
5. **And** all existing `jira-*` Tailwind custom colors are removed (from `tailwind.config.js` and from every consuming class in the renderer).
6. **And** no `dark:` prefix duplication remains in component classes. (Verified: the renderer currently uses **zero** `dark:` prefixes — the UI is statically dark via `jira-gray-*` classes — so this AC is satisfied as long as none are *introduced*. Confirm none appear after the migration.)
7. **And** contrast ratios for all foreground/background pairs meet WCAG 2.1 AA (4.5:1 minimum for normal text; 3:1 for large text / UI boundaries).

### Cross-cutting ACs (Epic 5a)

8. **And** at least one Vitest test verifies the token system (e.g., toggling `dark` on `document.documentElement` yields a different resolved `--color-surface-base`, and a known token resolves to its expected hex). `npm run test` passes.
9. **And** the app still launches and renders the Dashboard, Sidebar, and all pages without visual breakage (no missing backgrounds/text from removed `jira-*` classes). The current dark appearance is preserved by defaulting the `dark` class on `<html>`.

## Tasks / Subtasks

- [x] **Task 1 — Create the design token stylesheet** (AC: #2, #4)
  - [x] Create `src/renderer/styles/design-tokens.css`.
  - [x] Add a `:root { ... }` block with the **light** values and a `:root.dark { ... }` block with the **dark** values, using **identical variable names** in both blocks (the dark block overrides). Do NOT create `--color-*-dark` duplicate variables — the `-dark` suffix in `DESIGN.md` frontmatter is the source value to place inside `:root.dark`, not a separate runtime variable.
  - [x] Enumerate the full token set from `DESIGN.md` frontmatter (see **Token Reference** in Dev Notes). Prefix every variable with `--color-` (e.g. `--color-surface-elevated`, `--color-status-done-bg`, `--color-priority-high`).
  - [x] Import the stylesheet so it loads before Tailwind utilities — add `@import './styles/design-tokens.css';` at the **top** of `src/renderer/index.css` (before `@tailwind base;`), or import it in `main.tsx` ahead of `./index.css`.
- [x] **Task 2 — Map tokens to Tailwind utilities** (AC: #1, #3, #4, #5)
  - [x] In `tailwind.config.js`, set `darkMode: 'class'`.
  - [x] Remove the entire `jira` color object from `theme.extend.colors`.
  - [x] Add `theme.extend.colors` mappings for every token group, each pointing at the CSS variable, so utilities like `bg-surface-elevated`, `text-foreground-primary`, `border-border-default`, `bg-status-done-bg`, `text-status-done-fg`, `text-priority-high`, `bg-code-block-bg`, `text-accent`, `bg-destructive` resolve. Use `var(--color-...)`.
  - [x] Keep the `@tailwindcss/typography` plugin (still used by the Docs/markdown surfaces).
  - [x] Confirm the `content` glob still covers `./src/renderer/**/*.{js,ts,jsx,tsx}` so JIT picks up the new utility classes.
- [x] **Task 3 — Migrate existing renderer code off `jira-*` and hardcoded colors** (AC: #5, #6, #9)
  - [x] Replace every `jira-*` and ad-hoc hardcoded color class (e.g. `bg-blue-900/40`, `text-yellow-400`, `bg-jira-gray-900`) in the 14 renderer files (see **Files to migrate** in Dev Notes) with the new token utilities. This is a **functional mapping pass to keep the app working** — full visual polish of each component is deferred to Epics 5b-i / 5b-ii. Match colors to the closest token (e.g. sidebar fill → `bg-surface-elevated`, body text → `text-foreground-primary`, status badge pairs → `bg-status-*-bg text-status-*-fg`).
  - [x] Do not introduce any `dark:`-prefixed utilities (the token system handles theme switching; none exist in the renderer today — keep it that way).
  - [x] Update the focus ring in `src/renderer/index.css`: change `outline: 2px solid #0052cc;` to `outline: 2px solid var(--color-accent);` (keeps the WCAG 2.1 AA focus-ring contract from Story 1.5).
- [x] **Task 4 — Default the `dark` class** (AC: #9)
  - [x] Add `class="dark"` to the `<html>` element in `src/renderer/index.html` so dark (the hero theme) renders by default. NOTE: `prefers-color-scheme` detection, `localStorage('bmad-theme')` persistence, and the toggle UI are **Story 5a.4** — do not build them here. Just the static default class.
- [x] **Task 5 — Verify WCAG 2.1 AA contrast** (AC: #7)
  - [x] Check every foreground/background token pair (both themes) against 4.5:1 (normal text) / 3:1 (large text and UI component boundaries). Record results in the Dev Agent Record. If any pair fails, document it and propose the nearest compliant value (do not silently change `DESIGN.md` values — surface it).
- [x] **Task 6 — Token unit test** (AC: #8)
  - [x] Add a Vitest test (e.g. `src/renderer/styles/design-tokens.test.ts` or alongside an existing setup) that mounts a node, toggles `document.documentElement.classList` between light and `dark`, and asserts a token (e.g. `--color-surface-base`) resolves to the expected light vs dark hex via `getComputedStyle`. If jsdom does not evaluate the imported CSS variables reliably, instead assert against a small parsed token map or inject the `:root`/`:root.dark` rules into the test document. Keep the test deterministic.
  - [x] Run `npm run test` and confirm all tests pass.

## Dev Notes

> **⚠️ `project-context.md` is STALE — trust the actual codebase.** It describes the old Next.js/`jira-*` stack. This project has migrated to Electron + Vite + React Router (branch `migrate-to-desktop`). Source of truth for tokens is `DESIGN.md` frontmatter; source of truth for the implementation pattern is `architecture.md` → "Theme System Architecture".

### Why this story touches components (critical scope note)

Removing the `jira` color object from `tailwind.config.js` (AC #5) means Tailwind will **stop generating** classes like `bg-jira-gray-900`, `text-jira-gray-300`, `bg-jira-blue`, `border-jira-gray-700`. Any element still using them will lose its background/text/border and render broken. There are **146 such occurrences across 14 renderer files**. Therefore Task 3 (migrate consumers to the new token utilities) is **mandatory** to satisfy AC #9 ("app still renders without breakage") — it is not optional cleanup. Keep the migration *functional and minimal*: map to the nearest token, do not redesign components. The polished component rebuild (Sidebar, Card, Button, StatusBadge, badges, kanban, etc.) is explicitly scoped to **Epics 5b-i and 5b-ii** per `epics.md`.

### Implementation pattern (from architecture.md → "Theme System Architecture")

- CSS custom properties on `:root` (light) and `:root.dark` (dark) with the **same variable names**; the `dark` class on `<html>` flips every token at once. [Source: architecture.md#Theme System Architecture]
- Tailwind `darkMode: 'class'` stays enabled and maps the variables into utilities — the variables are the primary token mechanism, Tailwind utilities are the consumer surface. [Source: architecture.md#Theme System Architecture; epics.md#Story 5a.1]
- The architecture's CSS sample is **abbreviated** (`/* ... all status tokens ... */`). The **authoritative, complete** value list is `DESIGN.md` frontmatter — use it verbatim. [Source: DESIGN.md frontmatter `colors:`]

### Token Reference — complete value set (from DESIGN.md frontmatter)

Place light values in `:root`, dark values in `:root.dark`. Variable name = `--color-<token>` (strip the `-dark` suffix; the dark value goes into the `.dark` block under the same name).

**Surface** — light: `surface-base #F8F9FB`, `surface-elevated #FFFFFF`, `surface-sunken #F0F1F5`, `surface-overlay rgba(0,0,0,0.45)`; dark: `#0F1117`, `#181B23`, `#0A0C12`, `rgba(0,0,0,0.60)`.

**Foreground** — light: `foreground-primary #1A1D23`, `foreground-secondary #5A5F6B`, `foreground-tertiary #8B8FA3`, `foreground-on-accent #FFFFFF`; dark: `#E8EAED`, `#9BA1B0`, `#5C6170`, `#FFFFFF`.

**Accent (teal)** — light: `accent #0D9488`, `accent-hover #0F766E`, `accent-light #CCFBF1`, `accent-subtle #F0FDFA`; dark: `#2DD4BF`, `#14B8A6`, `#134E4A`, `#1A2E2C`.

**Borders** — light: `border-default #E2E4EA`, `border-strong #C9CDD6`; dark: `#2A2D3A`, `#3D4150`.

**Status (bg/fg pairs)** — light: backlog `#F1F1F4`/`#6B7280`, todo `#DBEAFE`/`#1E40AF`, in-progress `#FEF3C7`/`#92400E`, in-review `#EDE9FE`/`#6D28D9`, done `#D1FAE5`/`#065F46`, draft `#F3F4F6`/`#4B5563`, ready `#CCFBF1`/`#0F766E`. dark: backlog `#1E1F26`/`#9CA3AF`, todo `#1E2D45`/`#93C5FD`, in-progress `#2D2406`/`#FCD34D`, in-review `#2E1F5E`/`#C4B5FD`, done `#0D2818`/`#6EE7B7`, draft `#1E1F26`/`#9CA3AF`, ready `#1A2E2C`/`#2DD4BF`.

**Priority** — light: critical `#DC2626`, high `#EA580C`, medium `#D97706`, low `#2563EB`; dark: critical `#F87171`, high `#FB923C`, medium `#FBBF24`, low `#60A5FA`.

**Code** — light: inline-bg `#F1F5F9`, inline-fg `#0F766E`, block-bg `#1E1E2E`, block-fg `#CDD6F4`; dark: inline-bg `#232738`, inline-fg `#2DD4BF`, block-bg `#0A0C12`, block-fg `#CDD6F4`.

**Destructive** — light `#EF4444`; dark `#F87171`.

> Catppuccin code-block themes (Shiki) and Mermaid theming consume `--color-code-*` but are implemented later (Epic 5b-ii). Just define the tokens now.

### Source tree components to touch

- **NEW:** `src/renderer/styles/design-tokens.css` — the token definitions.
- **NEW:** token unit test (e.g. `src/renderer/styles/design-tokens.test.ts`).
- **UPDATE:** `tailwind.config.js` — `darkMode: 'class'`, remove `jira`, add token color map, keep typography plugin. [current state: only a `jira` color object; no `darkMode` key]
- **UPDATE:** `src/renderer/index.css` — import tokens at top; swap focus-ring `#0052cc` → `var(--color-accent)`. [current: 3 `@tailwind` directives + a `:focus-visible` base rule with hardcoded jira-blue]
- **UPDATE:** `src/renderer/index.html` — add `class="dark"` on `<html>`. [current: `<html lang="en">`]

### Files to migrate off `jira-*` / hardcoded colors (Task 3)

Counts of color-class occurrences (jira-/hardcoded), as a scope guide:
`src/renderer/components/Sidebar.tsx` (23), `src/renderer/pages/DiagnosticsPage.tsx` (27), `src/renderer/pages/DashboardPage.tsx` (18), `src/renderer/components/StatusBadge.tsx` (16), `src/renderer/pages/StoryDetailPage.tsx` (15), `src/renderer/components/CreateModal.tsx` (13), `src/renderer/pages/BacklogPage.tsx` (8), `src/renderer/pages/EpicsPage.tsx` (8), `src/renderer/pages/BoardPage.tsx` (7), `src/renderer/pages/DocsPage.tsx` (5), `src/renderer/pages/NotFoundPage.tsx` (3), `src/renderer/components/Layout.tsx` (1), `src/renderer/components/Providers.tsx` (1), `src/renderer/index.css` (1).

Mapping cheat-sheet for the functional pass:
- `bg-jira-gray-900` (sidebar) → `bg-surface-elevated`; `border-jira-gray-700` → `border-border-default`; `text-jira-gray-300/400` → `text-foreground-secondary/tertiary`; `bg-jira-blue` (active/CTA) → `bg-accent` + `text-foreground-on-accent`; `hover:bg-jira-gray-700` → `hover:bg-accent-subtle`.
- `StatusBadge` status map → `bg-status-<status>-bg text-status-<status>-fg`.
- `PriorityBadge` colors → `text-priority-<level>`. (The emoji icons 🔴🟠🟡🔵 and ⚡📖✅ in `StatusBadge.tsx`/`IssueTypeBadge` are a **Lucide migration** owned by **Story 5a.2** — leave the icons alone in this story; only swap the color classes.)

### Things to NOT do here (deferred)

- Theme toggle UI, `prefers-color-scheme` read, `localStorage('bmad-theme')`, no-flash-on-load → **Story 5a.4**.
- Inter/JetBrains Mono fonts, type ramp, Lucide icons, emoji removal → **Story 5a.2**.
- Toast system + Win11 transition utilities → **Story 5a.3**.
- Polished component visuals (Card/Button/Sidebar/badges/kanban) → **Epics 5b-i / 5b-ii**.

### Dead-code note

There is a stale pre-migration tree at `src/components/*` (old Next.js copies of Sidebar/CreateModal/StatusBadge/Providers). The Tailwind `content` glob only scans `src/renderer/**`, so these are **not** part of the build and do **not** need migration. Do not spend effort there; optionally flag for later removal but do not delete as part of this story.

### Testing standards summary

- **Vitest only** (no Jest/Cypress/Playwright). Tests live alongside source as `.test.ts(x)`. Existing setup: `src/renderer/setupTests.ts`, working examples `src/renderer/App.test.tsx`, `src/renderer/pages/DashboardPage.test.tsx`, `src/main/window-state.test.ts`. Run via `npm run test`. [Source: prior stories 1.4/1.5; project testing rules]

### Project Structure Notes

- Renderer code lives under `src/renderer/` (components, pages, lib, styles). `@/*` alias resolves to `src/renderer/*` via `vite.config.ts` `resolve.alias`. Keep new files inside `src/renderer/`.
- `tailwind.config.js` is CommonJS (`module.exports`); keep that format.
- No conflict with prior stories detected — this story extends the styling foundation laid bare in Story 1.3's migration.

### References

- [Source: epics.md#Story 5a.1: Implement CSS Custom Properties and Tailwind Config] — ACs verbatim.
- [Source: epics.md#Epic 5a: Dark Theme & Polished Foundation] — UX-DR1, UX-DR2 coverage; cross-cutting (WCAG AA contrast, Vitest token tests).
- [Source: architecture.md#Theme System Architecture] — `:root`/`:root.dark` pattern, Tailwind mapping sample, `darkMode: 'class'`, ThemeProvider (deferred to 5a.4).
- [Source: architecture.md#Decision Impact Analysis] — implementation sequence: tokens + Tailwind config come right after project init, before component migration.
- [Source: DESIGN.md frontmatter `colors:`] — authoritative complete token value set.
- [Source: DESIGN.md#Colors, #Status palette] — semantic intent (3-tier surface hierarchy; dual bg/fg status pairs guarantee AA in both modes).
- [Source: src/renderer/index.css, tailwind.config.js, src/renderer/components/StatusBadge.tsx, Sidebar.tsx] — current state being modified.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Tasks 1 and 2 were already completed in a prior session (design-tokens.css, tailwind.config.js, index.css import, focus-ring migration).
- Task 3: Completed migration of remaining jira-* classes. DashboardPage, DiagnosticsPage, StatusBadge, StoryDetailPage, BacklogPage, BoardPage, DocsPage, NotFoundPage, Layout, Providers were already migrated. Remaining: Sidebar.tsx (25 occurrences), CreateModal.tsx (12 occurrences), EpicsPage.tsx (1 occurrence).
- Task 4: Added `class="dark"` to `<html>` in index.html.
- Task 5: WCAG contrast analysis — see Completion Notes for details.
- Task 6: Created design-tokens.test.ts with 4 tests; all 30 tests pass.

### Completion Notes List

**WCAG 2.1 AA Contrast Analysis (Task 5):**

PASSING pairs (≥4.5:1 for normal text):
- foreground-primary on surface-base (light): ~17:1 ✅
- foreground-secondary on surface-base (light): ~8:1 ✅
- foreground-on-accent on accent light (#0D9488): ~5.1:1 ✅ (text is #0F1117 not #FFFFFF — fixed in code review)
- all status todo/in-progress/in-review/done badge pairs (light): 5–6:1 ✅
- foreground-on-accent on dark accent (#2DD4BF): ~10.6:1 ✅ (text is #0F1117 — fixed in code review)
- dark-theme foreground-primary/secondary on surface pairs: ✅
- dark-theme foreground-tertiary on surface-base: ~5.0:1 ✅ (lightened to #7C8294 in code review)
- all dark-theme status badge pairs: ✅

BORDERLINE/FAILING — documented, DESIGN.md NOT changed:

1. **backlog light badge** — BG `#F1F1F4` / FG `#6B7280` ≈ 3.9:1. Fails 4.5:1 for normal text. Passes 3:1 for UI components. Proposed fix: darken FG to `#4B5563` (~5.9:1).

2. **ready light badge** — BG `#CCFBF1` / FG `#0F766E` ≈ 4.5:1 borderline. Technically meets the threshold but only barely; monitor in polished component pass (Epic 5b-i).

3. **foreground-tertiary on surface-base (light)** — `#8B8FA3` on `#F8F9FB` ≈ 3.0:1. Fails 4.5:1 for normal text; passes 3:1 for supplementary UI text. Used only for placeholder/hint text across the app. Proposed fix: darken to `#6B7280` (~4.6:1) if normal-size text use increases.

4. **foreground-on-accent (both themes)** — FIXED in code review (2026-05-30). Light: `#0F1117` on `#0D9488` = ~5.1:1 ✅. Dark: `#0F1117` on `#2DD4BF` = ~10.6:1 ✅. DESIGN.md updated.

5. **foreground-tertiary on surface-base (dark)** — FIXED in code review (2026-05-30). `#7C8294` on `#0F1117` ≈ 5.0:1 ✅. Was `#5C6170` (~3.1:1). DESIGN.md updated.

**Token test approach (Task 6):**
jsdom 25 does not reliably cascade CSS custom properties from `<style>` tag selectors at test time. Used the story-recommended fallback: parse design-tokens.css as a string, extract token blocks, inject values via `element.style.setProperty()`, and assert via `getComputedStyle`. 4 deterministic tests cover: light value, dark value, toggle mechanism, and completeness of all 37 required tokens.

**Mapping summary (Task 3):**
- `bg-jira-gray-900` → `bg-surface-elevated`
- `border-jira-gray-700/600` → `border-border-default`
- `bg-jira-blue` / active states → `bg-accent text-foreground-on-accent`
- `hover:bg-jira-gray-700` → `hover:bg-accent-subtle`
- `text-jira-gray-300/400` → `text-foreground-secondary/tertiary`
- `bg-jira-gray-700/800` (inputs/panels) → `bg-surface-sunken` / `bg-surface-elevated`
- `bg-jira-blue-dark` → `bg-accent-hover`
- `bg-jira-gray-500/600` (secondary buttons) → `bg-surface-sunken`
- `text-jira-gray-100` → `text-foreground-primary`
- `placeholder-jira-gray-500` → `placeholder-foreground-tertiary`
- `focus:border-jira-blue` / `focus:ring-jira-blue` → `focus:border-accent` / `focus:ring-accent`
- `text-jira-gray-500` (empty states) → `text-foreground-tertiary`

### File List

- `src/renderer/styles/design-tokens.css` (created — full token set in :root and :root.dark)
- `src/renderer/styles/design-tokens.test.ts` (created — 4 Vitest tests for token system)
- `tailwind.config.js` (updated — darkMode: 'class', removed jira colors, added token color map)
- `src/renderer/index.css` (updated — import design-tokens.css at top, focus-ring uses var(--color-accent))
- `src/renderer/index.html` (updated — added class="dark" to <html>)
- `src/renderer/components/Sidebar.tsx` (updated — migrated all jira-* classes to token utilities)
- `src/renderer/components/CreateModal.tsx` (updated — migrated remaining jira-* on form elements)
- `src/renderer/pages/EpicsPage.tsx` (updated — migrated text-jira-gray-500 empty state)

### Change Log

- 2026-05-30: Completed story 5a.1 — CSS custom properties, Tailwind token config, full jira-* migration, dark class default, WCAG contrast audit, and Vitest token tests. 30/30 tests pass.

### Review Findings

- [x] [Review][Decision] Dark-mode on-accent contrast collapse: resolved — changed `--color-foreground-on-accent` to `#0f1117` in both `:root` and `:root.dark`. DESIGN.md updated.
- [x] [Review][Patch] Semantic bug — "completed" stat uses wrong token: DashboardPage and DiagnosticsPage map the "completed" count to `text-status-in-review-fg` (purple) instead of `text-status-done-fg` (green). [src/renderer/pages/DashboardPage.tsx, src/renderer/pages/DiagnosticsPage.tsx]
- [x] [Review][Patch] WCAG fail + dev record incorrect: white text on light-mode accent `#0d9488` is ~3.74:1 (fails 4.5:1 for normal text). Dev record incorrectly claims ~5.7:1. Record must be corrected; fix for button label contrast TBD with D1 resolution. [src/renderer/styles/design-tokens.css]
- [x] [Review][Patch] Undocumented WCAG fail: `text-destructive` (#ef4444) on `bg-status-backlog-bg` (#f1f1f4) ≈ 3.16:1 for the IssueTypeBadge "bug" type — not in dev record. Fixed: bug badge now uses `bg-destructive text-foreground-on-accent`. [src/renderer/components/StatusBadge.tsx]
- [x] [Review][Patch] Undocumented WCAG fail: dark-mode `--color-foreground-tertiary: #5c6170` on `--color-surface-base: #0f1117` ≈ 3.03:1. Dev record claims all dark pairs pass — incorrect. Fixed: lightened to `#7c8294` (~5.0:1). [src/renderer/styles/design-tokens.css]
- [x] [Review][Patch] `border.DEFAULT` and `border.default` are duplicate keys pointing to the same CSS var in tailwind.config.js — generates both `border-border` (unused) and `border-border-default`. Remove the `DEFAULT` alias. [tailwind.config.js]
- [x] [Review][Defer] Tailwind `content` glob `./src/renderer/**/*` does not cover root-level `src/components/` — pre-existing, files are likely dead code from Next.js migration [tailwind.config.js] — deferred, pre-existing
- [x] [Review][Defer] `--color-accent-light` name semantically inverts in dark mode (dark teal `#134e4a` named "light") — naming confusion, no functional bug [src/renderer/styles/design-tokens.css] — deferred, pre-existing
- [x] [Review][Defer] `--color-status-ready-bg` (light `#ccfbf1`) duplicates `--color-accent-light` value — they will drift independently when either is updated [src/renderer/styles/design-tokens.css] — deferred, pre-existing
