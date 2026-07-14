---
baseline_commit: ee159dfa24309ff2e4f45f8ffa47ee9d85917a06
---

# Story 5a.2: Setup Typography and Lucide Icons

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want Inter and JetBrains Mono fonts with Lucide icons throughout the app,
so that the UI looks modern and consistent, with no emoji or Heroicons.

## Acceptance Criteria

1. **Given** the application renders **When** I view any page **Then** all text uses Inter (UI) or JetBrains Mono (code) via `@fontsource/inter` and `@fontsource/jetbrains-mono`.
2. **And** Tailwind type ramp is configured: display (30px/700), h1 (24px/700), h2 (20px/600), h3 (16px/600), body (14px/400), body-sm (13px), caption (12px/500), mono (13px).
3. **And** all `@heroicons/react` imports are replaced with `lucide-react` equivalents. (Note: No `@heroicons/react` imports currently exist in the codebase — all icons are inline SVGs; these must be replaced with Lucide components. The dependency is also absent from `package.json`.)
4. **And** zero emoji-as-icons remain in the product (no ⚡📖✅🎯📋📄😿🔴🟠🟡🔵🔄📝).
5. **And** icon sizes follow the scale: 18px default, 16px inline, 22–24px stat cards, 14px badges, 36–48px empty states.
6. **And** `@heroicons/react` dependency is NOT in `package.json` (already satisfied — verify it stays absent).

## Tasks / Subtasks

- [x] **Task 1 — Install font packages and import them** (AC: #1)
  - [x] Run `npm install @fontsource/inter @fontsource/jetbrains-mono`.
  - [x] In `src/renderer/main.tsx`, add two import lines **at the top**, before any other imports: `import '@fontsource/inter/400.css'` and `import '@fontsource/inter/500.css'` and `import '@fontsource/inter/600.css'` and `import '@fontsource/inter/700.css'` and `import '@fontsource/jetbrains-mono/400.css'`.
  - [x] Verify Vite picks up the CSS (no build errors).

- [x] **Task 2 — Configure Tailwind fontFamily and type ramp** (AC: #1, #2)
  - [x] In `tailwind.config.js`, add `fontFamily` extension inside `theme.extend`:
    ```js
    fontFamily: {
      sans: ["'Inter'", "'Segoe UI'", 'system-ui', '-apple-system', 'sans-serif'],
      mono: ["'JetBrains Mono'", "'Cascadia Code'", "'Fira Code'", 'monospace'],
    },
    ```
  - [x] Add `fontSize` extension (as `[size, { lineHeight, fontWeight, letterSpacing? }]` tuples where relevant):
    ```js
    fontSize: {
      'display': ['1.875rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
      'h1':      ['1.5rem',   { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }],
      'h2':      ['1.25rem',  { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
      'h3':      ['1rem',     { lineHeight: '1.4',  fontWeight: '600' }],
      'body':    ['0.875rem', { lineHeight: '1.6',  fontWeight: '400' }],
      'body-sm': ['0.8125rem',{ lineHeight: '1.5',  fontWeight: '400' }],
      'caption': ['0.75rem',  { lineHeight: '1.4',  fontWeight: '500' }],
      'mono':    ['0.8125rem',{ lineHeight: '1.55', fontWeight: '400' }],
    },
    ```
  - [x] Keep the existing `colors`, `darkMode: 'class'`, and `plugins` entries unchanged.

- [x] **Task 3 — Install lucide-react and replace inline SVGs in Sidebar.tsx** (AC: #3, #5)
  - [x] Run `npm install lucide-react`.
  - [x] In `src/renderer/components/Sidebar.tsx`, add import at top: `import { LayoutDashboard, Columns2, AlignJustify, Zap, FileText, BarChart3, ChevronLeft, Settings, RefreshCw } from 'lucide-react';`
  - [x] Replace the 6 navItems inline `<svg>` elements with the corresponding Lucide components (size `18` with `className="shrink-0"`):
    - `nav.dashboard` → `<LayoutDashboard size={18} className="shrink-0" />`
    - `nav.board` → `<Columns2 size={18} className="shrink-0" />`
    - `nav.backlog` → `<AlignJustify size={18} className="shrink-0" />`
    - `nav.epics` → `<Zap size={18} className="shrink-0" />`
    - `nav.docs` → `<FileText size={18} className="shrink-0" />`
    - `nav.diagnostics` → `<BarChart3 size={18} className="shrink-0" />`
  - [x] Replace the collapse chevron `<svg>` (line ~132) with `<ChevronLeft size={16} className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />`.
  - [x] Replace the settings gear `<svg>` (line ~174) with `<Settings size={18} className="shrink-0" />`.
  - [x] Replace the sync refresh `<svg>` (line ~260) with `<RefreshCw size={18} className="shrink-0" />`.

- [x] **Task 4 — Replace emoji-as-icons in StatusBadge.tsx with Lucide icons** (AC: #4, #5)
  - [x] Add import to `StatusBadge.tsx`: `import { AlertOctagon, ArrowUp, Minus, ArrowDown, Zap, BookOpen, CheckSquare, Bug } from 'lucide-react';`
  - [x] Replace the `priorityStyles` icon strings with Lucide icon components. Change the type of `icon` from `string` to `React.ReactNode`. Use size `14` for badges:
    - `critical` → `<AlertOctagon size={14} />` (color already applied via `style.color` on the container)
    - `high` → `<ArrowUp size={14} />`
    - `medium` → `<Minus size={14} />`
    - `low` → `<ArrowDown size={14} />`
  - [x] In `PriorityBadge`, the `<span>{style.icon}</span>` renders the icon; since it's now a React node, keep `{style.icon}` directly (no wrapping `<span>` needed — just `{style.icon}`).
  - [x] In `IssueTypeBadge`, replace the `styles` object emoji icon strings with Lucide icon nodes of size `14`:
    - `epic` → `<Zap size={14} />`
    - `story` → `<BookOpen size={14} />`
    - `task` → `<CheckSquare size={14} />`
    - `bug` → `<Bug size={14} />`
  - [x] The `<span>{s.icon}</span>` in `IssueTypeBadge` should be changed to `{s.icon}` directly (since it's a React node, not a string).

- [x] **Task 5 — Replace inline SVG in CreateModal.tsx** (AC: #3)
  - [x] Add import to `CreateModal.tsx`: `import { X } from 'lucide-react';`
  - [x] Replace the close button `<svg>` (with X path) with `<X size={18} className="text-foreground-tertiary" />`.

- [x] **Task 6 — Remove emoji from i18n strings** (AC: #4)
  - [x] In `src/renderer/lib/i18n.tsx`, remove the emoji prefix from these string values (keep the text):
    - `'priority.critical.icon'`: remove `🔴 ` (both ru and en)
    - `'priority.high.icon'`: remove `🟠 ` (both ru and en)
    - `'priority.medium.icon'`: remove `🟡 ` (both ru and en)
    - `'priority.low.icon'`: remove `🔵 ` (both ru and en)
    - `'story.hasFile'` ru: `'📄 Есть файл'` → `'Есть файл'`
    - `'story.hasFile'` en: `'📄 Has file'` → `'Has file'`
    - `'diag.resync'` ru: `'🔄 Пересинхронизировать'` → `'Пересинхронизировать'`
    - `'diag.resync'` en: `'🔄 Resynchronize'` → `'Resynchronize'`
    - `'diag.fileSource'` ru: `'📄 Файл'` → `'Файл'`
    - `'diag.fileSource'` en: `'📄 File'` → `'File'`
    - `'diag.inlineSource'` ru: `'📝 Inline'` → `'Inline'`
    - `'diag.inlineSource'` en: `'📝 Inline'` → `'Inline'` (already no emoji to remove; verify)

- [x] **Task 7 — Add Lucide icon to DiagnosticsPage resync button** (AC: #4)
  - [x] In `src/renderer/pages/DiagnosticsPage.tsx`, add import: `import { RefreshCw } from 'lucide-react';`
  - [x] In the resync button, change content from `{syncing ? t('diag.syncing') : t('diag.resync')}` to:
    ```tsx
    <span className="inline-flex items-center gap-1.5">
      <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
      {syncing ? t('diag.syncing') : t('diag.resync')}
    </span>
    ```

- [x] **Task 8 — Add Lucide icon to StoryDetailPage hasFile indicator** (AC: #4)
  - [x] In `src/renderer/pages/StoryDetailPage.tsx`, add import: `import { FileText } from 'lucide-react';`
  - [x] Change the `story.hasFile` span (line ~69) from:
    ```tsx
    <span className="text-foreground-tertiary">{t('story.hasFile')}</span>
    ```
    to:
    ```tsx
    <span className="inline-flex items-center gap-1 text-foreground-tertiary">
      <FileText size={14} />
      {t('story.hasFile')}
    </span>
    ```

- [x] **Task 9 — Write Vitest test** (AC: cross-cutting Vitest requirement)
  - [x] Create `src/renderer/lib/typography.test.ts`.
  - [x] Write tests that verify: (a) the Tailwind `fontSize` config exports the expected keys (`display`, `h1`, `h2`, `h3`, `body`, `body-sm`, `caption`, `mono`); (b) each entry has the correct size value; (c) the `fontFamily.sans` array includes `'Inter'`; (d) the `fontFamily.mono` array includes `'JetBrains Mono'`.
  - [x] Import the tailwind config directly from `../../../tailwind.config` (relative from test file — use `require` since it's CommonJS).
  - [x] Run `npm run test` and confirm all tests pass (30 existing + 14 new = 44 total).

- [x] **Task 10 — Final verification** (AC: all)
  - [x] Confirm `@heroicons/react` does NOT appear in `package.json`.
  - [x] Run `npm run dev` and visually verify the app renders with Inter font (check Dev Tools font rendering if possible).
  - [x] Run `npm run lint` — TypeScript strict mode: no `any` types from Lucide icon nodes. ✅ 0 errors.
  - [x] Run `npm run test` — all 44 tests pass. ✅
  - [ ] Import the tailwind config directly from `../../../tailwind.config` (relative from test file — use `require` since it's CommonJS).
  - [ ] Run `npm run test` and confirm all tests pass (30+ existing + new tests).

- [ ] **Task 10 — Final verification** (AC: all)
  - [ ] Confirm `@heroicons/react` does NOT appear in `package.json`.
  - [ ] Run `npm run dev` and visually verify the app renders with Inter font (check Dev Tools font rendering if possible).
  - [ ] Run `npm run lint` — TypeScript strict mode: ensure no `any` types from Lucide icon nodes in `priorityStyles`.
  - [ ] Run `npm run test` — all tests pass.

## Dev Notes

### Critical Context from Previous Story (5a.1)

Story 5a.1 completed the full token migration. Key learnings:
- **`project-context.md` is STALE** — it describes the old Next.js stack. Trust the actual codebase on branch `migrate-to-desktop`.
- All `jira-*` colors removed; token utilities (`bg-surface-elevated`, `text-foreground-primary`, etc.) now work.
- `tailwind.config.js` is **CommonJS** (`module.exports`). Keep that format. The Vitest test for tokens uses `require()` to import it — follow the same pattern for the typography test.
- Tests live alongside source as `.test.ts(x)`. Run via `npm run test`.
- `@/*` resolves to `src/renderer/*` via `vite.config.ts` alias.

### @heroicons/react Status

`@heroicons/react` is **not in `package.json`** and not imported anywhere in `src/renderer/**`. The Sidebar uses manually crafted inline `<svg>` elements that happen to be styled like Heroicons outlines. These must be replaced per the architecture directive ("Lucide replaces `@heroicons/react` and all emoji decorators").

### Emoji-as-Icons Locations (complete inventory)

| File | Emoji | i18n key | Replace with |
|---|---|---|---|
| `src/renderer/components/StatusBadge.tsx` line 15 | 🔴 | `priorityStyles.critical.icon` | `<AlertOctagon size={14} />` |
| `src/renderer/components/StatusBadge.tsx` line 16 | 🟠 | `priorityStyles.high.icon` | `<ArrowUp size={14} />` |
| `src/renderer/components/StatusBadge.tsx` line 17 | 🟡 | `priorityStyles.medium.icon` | `<Minus size={14} />` |
| `src/renderer/components/StatusBadge.tsx` line 18 | 🔵 | `priorityStyles.low.icon` | `<ArrowDown size={14} />` |
| `src/renderer/components/StatusBadge.tsx` line 47 | ⚡ | `IssueTypeBadge.epic.icon` | `<Zap size={14} />` |
| `src/renderer/components/StatusBadge.tsx` line 48 | 📖 | `IssueTypeBadge.story.icon` | `<BookOpen size={14} />` |
| `src/renderer/components/StatusBadge.tsx` line 49 | ✅ | `IssueTypeBadge.task.icon` | `<CheckSquare size={14} />` |
| `src/renderer/lib/i18n.tsx` lines 51–54, 242–245 | 🔴🟠🟡🔵 | `priority.*.icon` (ru + en) | Strip emoji prefix, keep text |
| `src/renderer/lib/i18n.tsx` lines 134, 325 | 📄 | `story.hasFile` (ru + en) | Strip emoji; add icon in StoryDetailPage |
| `src/renderer/lib/i18n.tsx` lines 169, 360 | 🔄 | `diag.resync` (ru + en) | Strip emoji; add `<RefreshCw>` in DiagnosticsPage |
| `src/renderer/lib/i18n.tsx` lines 194, 385 | 📄 | `diag.fileSource` (ru + en) | Strip emoji |
| `src/renderer/lib/i18n.tsx` lines 195, 386 | 📝 | `diag.inlineSource` (ru + en) | Verify no emoji (en already clean) |

> **Note:** `diag.fileSource` and `diag.inlineSource` are defined in i18n but **not currently rendered by any component** (no `t('diag.fileSource')` calls found in renderer). Still strip the emoji from the strings for correctness.

### TypeScript Type Change in StatusBadge

The `priorityStyles` record currently types `icon` as `string`. When switching to Lucide nodes, the type must change:

```tsx
import { AlertOctagon, ArrowUp, Minus, ArrowDown } from 'lucide-react';

const priorityStyles: Record<Priority, { color: string; icon: React.ReactNode }> = {
  critical: { color: 'text-priority-critical', icon: <AlertOctagon size={14} /> },
  high:     { color: 'text-priority-high',     icon: <ArrowUp size={14} />     },
  medium:   { color: 'text-priority-medium',   icon: <Minus size={14} />       },
  low:      { color: 'text-priority-low',      icon: <ArrowDown size={14} />   },
};
```

The `IssueTypeBadge` `styles` object likewise must type `icon` as `React.ReactNode`:

```tsx
import { Zap, BookOpen, CheckSquare, Bug } from 'lucide-react';

const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  epic:  { bg: 'bg-status-in-review-bg', text: 'text-status-in-review-fg', icon: <Zap size={14} />         },
  story: { bg: 'bg-status-done-bg',      text: 'text-status-done-fg',      icon: <BookOpen size={14} />    },
  task:  { bg: 'bg-status-todo-bg',      text: 'text-status-todo-fg',      icon: <CheckSquare size={14} /> },
  bug:   { bg: 'bg-destructive',         text: 'text-foreground-on-accent', icon: <Bug size={14} />         },
};
```

> `React.ReactNode` requires `import React from 'react'` or relies on the JSX transform. The renderer already uses JSX transform via Vite/React plugin — no explicit React import needed in most files. However, `StatusBadge.tsx` currently has no React import. Add `import React from 'react'` if the TypeScript compiler complains about `React.ReactNode`.

### @fontsource Import Strategy

`@fontsource` packages ship individual CSS files per weight. Import the weights actually used:
- Inter weights used: 400 (body), 500 (caption/medium), 600 (h2/h3), 700 (h1/display)
- JetBrains Mono weights used: 400 (mono)

Import these in `src/renderer/main.tsx` **before** `'./index.css'` to ensure fonts load before styles:

```tsx
// Font imports — must be before index.css
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';

import './index.css';
// ... rest of imports
```

### Tailwind Config: Type Ramp Values (from DESIGN.md frontmatter)

Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md` frontmatter `typography:` section.

Note: DESIGN.md `fontSize` values are in `px`. Convert to `rem` for Tailwind (÷16):
- display: 30px → 1.875rem
- h1: 24px → 1.5rem
- h2: 20px → 1.25rem
- h3: 16px → 1rem
- body: 14px → 0.875rem
- body-sm: 13px → 0.8125rem
- caption: 12px → 0.75rem
- mono: 13px → 0.8125rem

### Lucide Icon Size Scale (from UX-DR4)

| Context | Size | Lucide prop |
|---|---|---|
| Nav / default | 18px | `size={18}` |
| Inline (body text) | 16px | `size={16}` |
| Stat cards | 22–24px | `size={22}` or `size={24}` |
| Badges (priority, issue type) | 14px | `size={14}` |
| Empty states | 36–48px | `size={36}` or `size={48}` |

### Sidebar SVG → Lucide Mapping

| Current SVG path describes | Lucide component | Notes |
|---|---|---|
| 4 rectangles grid (dashboard) | `LayoutDashboard` | 18px, shrink-0 |
| 3 vertical columns (kanban) | `Columns2` | 18px, shrink-0 |
| 4 horizontal lines (list) | `AlignJustify` | 18px, shrink-0 |
| Lightning bolt (epics) | `Zap` | 18px, shrink-0 |
| Document with text (docs) | `FileText` | 18px, shrink-0 |
| Bar chart in doc (diagnostics) | `BarChart3` | 18px, shrink-0 |
| Chevron left (collapse toggle) | `ChevronLeft` | 16px, transition-transform |
| Gear/settings (settings button) | `Settings` | 18px, shrink-0 |
| Refresh arrows (sync button) | `RefreshCw` | 18px, shrink-0 |

CreateModal SVG (close X) → `X` from lucide-react, size 18.

### What NOT to Do (Deferred to Later Stories)

- **Theme toggle UI** (sun/moon icon, localStorage, prefers-color-scheme) → **Story 5a.4**
- **Toast system** (toast component, replacing alert() calls) → **Story 5a.3**
- **Polished component visuals** (Card, Button, full Sidebar rebuild) → **Epics 5b-i / 5b-ii**
- **Mermaid + Shiki rendering** → **Epic 5b-ii**
- Do NOT apply the new `text-body`, `text-caption`, etc. Tailwind classes across all components — just configure the ramp. Applying the type ramp to components is 5b-i scope.

### Source Tree: Files to Create/Modify

**NEW:**
- `src/renderer/lib/typography.test.ts` — Vitest test for Tailwind type ramp config

**UPDATE:**
- `src/renderer/main.tsx` — add @fontsource imports at top
- `tailwind.config.js` — add `fontFamily` and `fontSize` to `theme.extend`
- `src/renderer/components/Sidebar.tsx` — replace 9 inline SVGs with Lucide icons
- `src/renderer/components/StatusBadge.tsx` — replace emoji with Lucide icons + update types
- `src/renderer/components/CreateModal.tsx` — replace X SVG with Lucide `X`
- `src/renderer/lib/i18n.tsx` — strip emoji from 12 string values
- `src/renderer/pages/DiagnosticsPage.tsx` — add `<RefreshCw>` to resync button
- `src/renderer/pages/StoryDetailPage.tsx` — add `<FileText>` to hasFile indicator

**VERIFY (no change needed):**
- `package.json` — confirm `@heroicons/react` is absent (it is)

### Testing Standards

- **Vitest only** (no Jest/Cypress/Playwright). Tests live alongside source as `.test.ts(x)`.
- Existing setup: `src/renderer/setupTests.ts`, `src/renderer/App.test.tsx`, `src/main/window-state.test.ts`.
- Run: `npm run test`.
- The typography test imports `tailwind.config.js` via `require()` (CommonJS), same pattern as design-tokens.test.ts.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5a.2] — ACs verbatim + Epic 5a context
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md frontmatter `typography:`] — authoritative type ramp values
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md frontmatter `components:`] — component-level icon usage reference
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns] — "Icon System: Lucide (stroke-based, outline, 1.5px stroke, 18px default). Replaces `@heroicons/react` and all emoji decorators."
- [Source: _bmad-output/planning-artifacts/epics.md#UX-DR4] — full icon migration requirements
- [Source: _bmad-output/planning-artifacts/epics.md#UX-DR3] — full typography requirements
- [Source: _bmad-output/implementation-artifacts/5a-1-implement-css-custom-properties-and-tailwind-config.md] — previous story: tailwind.config.js format (CommonJS), testing pattern

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Task 9: Initial test had wrong relative path (`../../../../tailwind.config` instead of `../../../tailwind.config`). Fixed immediately; all 44 tests passed on second run.

### Completion Notes List

- Installed `@fontsource/inter` (weights 400/500/600/700) and `@fontsource/jetbrains-mono` (400). Imported in `main.tsx` before `index.css` to ensure fonts load first.
- Extended `tailwind.config.js` with `fontFamily.sans` (Inter) and `fontFamily.mono` (JetBrains Mono), plus 8-step `fontSize` type ramp (display→mono) with `rem` values and lineHeight/fontWeight metadata.
- Replaced all 9 inline SVG elements in `Sidebar.tsx` with Lucide components: 6 nav icons (18px), collapse chevron (16px), settings gear (18px), sync button (18px).
- Replaced all emoji-as-icons in `StatusBadge.tsx` — `priorityStyles` uses `React.ReactNode` type with `AlertOctagon/ArrowUp/Minus/ArrowDown` (14px), `IssueTypeBadge` uses `Zap/BookOpen/CheckSquare/Bug` (14px).
- Replaced X SVG in `CreateModal.tsx` with `<X size={18} />` from lucide-react.
- Stripped emoji prefix from 12 i18n string values in both `ru` and `en` locales.
- Added `<RefreshCw size={16}>` with `animate-spin` to DiagnosticsPage resync button.
- Added `<FileText size={14}>` to StoryDetailPage `story.hasFile` indicator.
- Created `src/renderer/lib/typography.test.ts` — 14 tests covering fontFamily and all 8 fontSize ramp entries with size/weight validation.
- All 44 tests pass; TypeScript lint 0 errors; `@heroicons/react` absent from package.json.

### File List

- `src/renderer/main.tsx` (updated — @fontsource imports added before index.css)
- `tailwind.config.js` (updated — fontFamily.sans/mono, fontSize type ramp added to theme.extend)
- `src/renderer/components/Sidebar.tsx` (updated — 9 inline SVGs replaced with Lucide icons)
- `src/renderer/components/StatusBadge.tsx` (updated — emoji replaced with Lucide nodes, React.ReactNode types)
- `src/renderer/components/CreateModal.tsx` (updated — X SVG replaced with Lucide X)
- `src/renderer/lib/i18n.tsx` (updated — emoji stripped from 12 string values in ru/en)
- `src/renderer/pages/DiagnosticsPage.tsx` (updated — RefreshCw icon added to resync button)
- `src/renderer/pages/StoryDetailPage.tsx` (updated — FileText icon added to hasFile indicator)
- `src/renderer/lib/typography.test.ts` (created — 14 Vitest tests for type ramp and fontFamily)

### Change Log

- 2026-05-30: Completed story 5a.2 — @fontsource fonts, Tailwind type ramp, lucide-react migration (9 Sidebar SVGs + StatusBadge emoji + CreateModal X), i18n emoji cleanup, DiagnosticsPage/StoryDetailPage icon additions. 44/44 tests pass.

### Review Findings

- [x] [Review][Patch] DiagnosticsPage.tsx — дублирующиеся ветки RefreshCw button [src/renderer/pages/DiagnosticsPage.tsx:44-56]
- [x] [Review][Patch] StatusBadge.tsx — `import React` только ради типа, заменить на `import type { ReactNode }` [src/renderer/components/StatusBadge.tsx:1]
- [x] [Review][Defer] BoardPage.tsx — карточки стори не кликабельны (нет <Link> к StoryDetailPage) [src/renderer/pages/BoardPage.tsx] — deferred, pre-existing
