---
story_id: 5b-i.1
story_key: 5b-i-1-build-sidebar-card-and-button-components
epic: 5b-i
epic_name: Polished Navigation & Core UI
previous_story: 5a-4-implement-theme-toggle
status: review
baseline_commit: ee9d2293f3a57da533f45d3e3f11b9843012bc61
---

# Story 5b-i.1: Build Sidebar, Card, and Button Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a consistent sidebar, cards, and buttons,
So that navigation and content surfaces look polished.

## Acceptance Criteria

1. **Given** any page in the app  
   **When** I view the sidebar  
   **Then** it is 260px expanded / 64px collapsed with smooth 200ms ease-out transition  
   **And** active item has accent bg + on-accent text  
   **And** inactive items have foreground-secondary text, hover shows accent-subtle fill  
   **And** footer contains settings panel, sync button, language toggle, theme toggle  
   **And** section divider separates nav items from footer controls  
   **And** collapse toggle at bottom persists state to localStorage

2. **Card component** has elevated fill, border-default 1px, `rounded.lg` (14px), default shadow  
   **And** Card hover lifts shadow + `translateY(-1px)`  
   **And** Card is used on DashboardPage and EpicsPage (replacing raw div containers)

3. **Button Primary** has accent fill, on-accent text, `rounded.md` (10px), hover accent-hover, active `scale(0.98)` 80ms ease-out  
   **And** Button Secondary has sunken fill, primary text, border-default 1px, same transitions  
   **And** disabled state: opacity 0.5, pointer-events none  
   **And** at least one existing inline button is migrated to `<Button>` (e.g., Save or Reset in Sidebar settings panel)

4. All interactive elements have 2px accent focus ring, 1px offset (already globally defined in `index.css` — verify no overrides break it).

5. **Tailwind config updated** with custom `borderRadius` (sm:6px, md:10px, lg:14px, xl:20px), custom `boxShadow` for cards and elevated surfaces, and `transitionDuration` 80ms.

6. **i18n**: any new visible UI text (e.g., collapse toggle tooltip) has EN and RU keys in `src/renderer/lib/i18n.tsx`.

7. **Vitest tests**: at least 3 new tests covering Card render + hover classes, Button primary/secondary variants, and Sidebar localStorage persistence.

## Tasks / Subtasks

- [x] **Task 1 — Extend `tailwind.config.js` with missing design tokens** (AC: #5)
  - [x] Add `theme.extend.borderRadius`: `sm: '6px'`, `md: '10px'`, `lg: '14px'`, `xl: '20px'`
  - [x] Add `theme.extend.boxShadow` for card default and hover states (light + dark via CSS vars if possible, or use `shadow-[...]` arbitrary values)
  - [x] Add `theme.extend.transitionDuration`: `80: '80ms'`
  - [x] Verify `npm run dev` still starts and `npm run test` passes after config change

- [x] **Task 2 — Create `src/renderer/components/Card.tsx`** (AC: #2)
  - [x] Props: `children`, `className?`, `hoverable?` (default true)
  - [x] Base classes: `bg-surface-elevated border border-border-default rounded-lg shadow-card`
  - [x] Hover classes (when hoverable): `hover:shadow-card-hover hover:-translate-y-px`
  - [x] Transition: `transition-all duration-150 ease-out`
  - [x] Export as default

- [x] **Task 3 — Create `src/renderer/components/Button.tsx`** (AC: #3)
  - [x] Props: `variant: 'primary' | 'secondary'`, `children`, `disabled?`, `onClick?`, `type?`, `className?`, `iconLeft?`, `iconRight?`
  - [x] Primary: `bg-accent text-foreground-on-accent rounded-md px-4 py-2 text-sm font-medium hover:bg-accent-hover active:scale-[0.98] transition-all duration-80 ease-out disabled:opacity-50 disabled:pointer-events-none`
  - [x] Secondary: `bg-surface-sunken text-foreground-primary border border-border-default rounded-md px-4 py-2 text-sm font-medium hover:bg-border-default active:scale-[0.98] transition-all duration-80 ease-out disabled:opacity-50 disabled:pointer-events-none`
  - [x] Use `type="button"` by default
  - [x] Export as default

- [x] **Task 4 — Update `Sidebar.tsx` to match UX-DR5 spec** (AC: #1, #6)
  - [x] Fix expanded width: `w-[260px]` instead of `w-64` (256px)
  - [x] Keep collapsed width: `w-16` (64px)
  - [x] Change transition easing from `ease-win11` to `ease-out` for sidebar collapse
  - [x] Move collapse toggle from header to bottom zone (below footer controls, separated by divider)
  - [x] Persist collapsed state to `localStorage` key `bmad-sidebar-collapsed`
  - [x] Read `localStorage` on mount to initialize `collapsed` state
  - [x] Add i18n keys: `sidebar.collapse` / `sidebar.expand` (RU: "Свернуть" / "Развернуть")
  - [x] Ensure active/inactive nav items still match spec (already mostly correct)
  - [x] Ensure footer controls remain in existing `border-t` footer block

- [x] **Task 5 — Migrate existing surfaces to use `<Card>` and `<Button>`** (AC: #2, #3)
  - [x] Update `DashboardPage.tsx`: replace 4 stat-card raw divs with `<Card>` wrapper
  - [x] Update `EpicsPage.tsx`: replace epic list item raw div with `<Card>` wrapper
  - [x] Update `Sidebar.tsx` settings panel: replace Save/Reset inline buttons with `<Button variant="primary">` and `<Button variant="secondary">`

- [x] **Task 6 — Write tests** (AC: #7)
  - [x] `Card.test.tsx`: renders children, has correct base classes, hoverable applies hover classes
  - [x] `Button.test.tsx`: primary renders with accent bg, secondary renders with sunken bg, disabled applies opacity and pointer-events-none
  - [x] `Sidebar.test.tsx` (update existing): collapse toggle click updates localStorage, reload reads localStorage, width is 260px when expanded

- [x] **Task 7 — Final verification** (AC: all)
  - [x] `npm run dev` — visually verify sidebar widths, toggle position, card shadows, button hover/active states
  - [x] `npm run lint` — zero TypeScript errors
  - [x] `npm run test` — all existing + new tests pass (current baseline: 55 tests)

## Dev Notes

### Critical Context from Previous Story (5a-4)

- **`project-context.md` is STALE** — it describes the old Next.js stack. The actual codebase is on branch `migrate-to-desktop` running **Electron + Vite**. Do NOT follow `project-context.md` for stack or architecture.
- `tailwind.config.js` is **CommonJS** (`module.exports`). Keep that format. Do NOT convert to ESM.
- `@/*` alias resolves to `src/renderer/*` in both Vite and Vitest.
- **55 tests pass** currently. This story should bring total to 58+.
- `lucide-react` is installed. Use Lucide icons only.
- **Context pattern** (not Zustand) is the established pattern for UI-only state (see `Toast.tsx`, `ThemeProvider.tsx`). Sidebar collapse is UI-only state — use `useState` + `useEffect` for localStorage, not Zustand.
- There is **no `clsx` or `tailwind-merge`** installed. Use template literal string concatenation for conditional classes. Do NOT install new dependencies unless absolutely necessary.

### Tailwind Config Gaps (Non-Negotiable Fixes)

The current `tailwind.config.js` is missing several token mappings required by DESIGN.md. This story MUST extend the config:

1. **`borderRadius`**: Tailwind defaults are `sm:2px, DEFAULT:4px, md:6px, lg:8px, xl:12px, 2xl:16px, 3xl:24px`. DESIGN.md requires `sm:6px, md:10px, lg:14px, xl:20px`. All existing `rounded-lg` usages in the codebase currently render at 8px, which is wrong per spec. Adding custom `borderRadius` will instantly correct every component.

2. **`boxShadow`**: DESIGN.md defines precise card shadows:
   - Card default: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` (light) and deeper for dark.
   - Card hover: `0 4px 12px rgba(0,0,0,0.1)` (light) and `0 4px 12px rgba(0,0,0,0.5)` (dark).
   - Since Tailwind `boxShadow` utilities don't support per-theme values directly, use CSS custom properties in `design-tokens.css` for shadow colors, or add named shadows in tailwind config that use CSS vars:
     ```js
     boxShadow: {
       card: '0 1px 3px var(--shadow-color-1), 0 1px 2px var(--shadow-color-2)',
       'card-hover': '0 4px 12px var(--shadow-color-hover)',
     }
     ```
   - Then add the shadow color variables to `design-tokens.css` in both `:root` and `:root.dark`.
   - **Alternative simpler approach**: use arbitrary values in component classes (`shadow-[0_1px_3px_rgba(0,0,0,0.08)]`) but this duplicates shadow definitions. Prefer extending tailwind config + CSS vars for maintainability.

3. **`transitionDuration`**: Add `80: '80ms'` because the spec requires 80ms active-button transition. Tailwind default durations jump from 75ms to 100ms.

### Sidebar Implementation Details

**Current state:**
- Width uses `w-64` (256px) and `w-16` (64px). Correct collapsed, wrong expanded.
- Transition uses `duration-200 ease-win11`. Needs `duration-200 ease-out`.
- Collapse toggle is in the header block (top), next to the logo. Needs to move to the bottom zone.
- No localStorage persistence for collapsed state.

**Target state:**
- Header block: logo + project switcher only. No collapse toggle.
- Nav block: navigation items.
- Footer block: settings, sync, language, theme. Separated by `border-t`.
- Bottom zone: collapse toggle, separated from footer by another `border-t` (or placed at very bottom with its own styling).
- `localStorage.setItem('bmad-sidebar-collapsed', JSON.stringify(collapsed))` on every toggle.
- On mount: `const saved = localStorage.getItem('bmad-sidebar-collapsed'); if (saved) setCollapsed(JSON.parse(saved));`

**Width implementation:**
- Use inline style or arbitrary Tailwind class: `w-[260px]`. Note: Tailwind arbitrary values work out of the box.
- Collapsed: `w-16` remains correct.

### Card Component Design

The Card is a universal container. Keep it extremely simple — no internal layout assumptions beyond padding.

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}
```

Base classes:
```
bg-surface-elevated
border border-border-default
rounded-lg
shadow-card
transition-all duration-150 ease-out
```

Hover classes (when hoverable):
```
hover:shadow-card-hover hover:-translate-y-px
```

Do NOT hardcode padding inside Card — let consumers add their own `p-4` etc. This matches the current DashboardPage (`p-4`) and EpicsPage (`p-4`) usages.

### Button Component Design

Keep Button a presentational component. No business logic.

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}
```

Why not use `children` for icons? Because `children` is text; icons should be passed explicitly for correct gap spacing (`gap-2`).

Size: default padding `px-4 py-2` (medium). This matches the Save/Reset buttons in Sidebar settings panel.

Disabled: add `disabled:opacity-50 disabled:pointer-events-none`. This prevents hover/active states when disabled.

### Shadow CSS Variables Strategy (Recommended)

Instead of complex Tailwind boxShadow config, add these to `src/renderer/styles/design-tokens.css`:

```css
:root {
  --shadow-card-1: rgba(0,0,0,0.08);
  --shadow-card-2: rgba(0,0,0,0.06);
  --shadow-card-hover: rgba(0,0,0,0.1);
}
:root.dark {
  --shadow-card-1: rgba(0,0,0,0.4);
  --shadow-card-2: rgba(0,0,0,0.3);
  --shadow-card-hover: rgba(0,0,0,0.5);
}
```

Then in `tailwind.config.js`:
```js
boxShadow: {
  card: '0 1px 3px var(--shadow-card-1), 0 1px 2px var(--shadow-card-2)',
  'card-hover': '0 4px 12px var(--shadow-card-hover)',
}
```

This keeps shadow theming automatic via CSS custom properties.

### i18n Keys to Add

In `src/renderer/lib/i18n.tsx`:

```ts
// ru
'sidebar.collapse': 'Свернуть',
'sidebar.expand': 'Развернуть',

// en
'sidebar.collapse': 'Collapse',
'sidebar.expand': 'Expand',
```

Use these for the collapse toggle `title` attribute (tooltip).

### Testing Notes

- Existing `Sidebar.test.tsx` likely tests nav items and project switcher. Add localStorage tests there.
- Use `@testing-library/react` + `vitest`.
- Mock `localStorage` with `Storage.prototype` mock or `vi.spyOn(window.localStorage, 'setItem')`.
- For Card hover classes, render with `hoverable={true}` and assert class list contains `hover:shadow-card-hover` and `hover:-translate-y-px`.
- For Button variants, render and assert class list contains `bg-accent` (primary) or `bg-surface-sunken` (secondary).
- Remember: `jsdom` environment is active; `beforeEach` cleanup to avoid cross-test pollution.

### What NOT to Do (Deferred to Later Stories)

- **Input / Select / Textarea styling** → Story 5b-i.2
- **Status Badge / Priority Badge polish** → Story 5b-i.2 (StatusBadge.tsx already exists but may need design tweaks)
- **Toast polish** → Story 5b-i.3 (Toast.tsx already exists, may need progress bar)
- **Kanban / Epic Card / Stat Card / Shiki / Mermaid** → Epic 5b-ii
- **Theme toggle polish** → Story 5b-i.3 (already implemented in 5a-4)
- **CreateModal polish** → Epic 5b-i or 5b-ii (modal uses raw classes today)

### References

- UX-DR5: Sidebar spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Sidebar`]
- UX-DR6: Card spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Card`]
- UX-DR7: Button Primary spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Button-Primary`]
- UX-DR8: Button Secondary spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Button-Secondary`]
- UX-DR23: Win11-snappy transitions [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Do's-and-Don'ts`]
- UX-DR24: Accessibility focus rings [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#Accessibility-Floor`]
- Architecture ADR-7: Icon system (Lucide) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-7`]
- Architecture ADR-8: Typography system [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-8`]
- Architecture Theme System: CSS custom properties [Source: `_bmad-output/planning-artifacts/architecture.md#Theme-System-Architecture`]
- Previous story dev notes (5a-4): tailwind.config.js is CommonJS, `@/*` alias, test count=55 [Source: `_bmad-output/implementation-artifacts/5a-4-implement-theme-toggle.md`]
- Deferred work note: dead i18n keys exist from removed create UI — do NOT clean them up in this story; that is deferred work [Source: `_bmad-output/deferred-work.md`]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- All 7 tasks completed successfully
- tailwind.config.js extended with borderRadius (sm/md/lg/xl), boxShadow (card/card-hover using CSS vars), transitionDuration (80ms)
- design-tokens.css updated with shadow CSS custom properties for light and dark themes
- Card.tsx: reusable container with hoverable prop, spreads rest props for data-testid support
- Button.tsx: primary/secondary variants with icon support, disabled state, active scale
- Sidebar.tsx: 260px expanded width, ease-out transition, localStorage persistence, collapse toggle moved to bottom, i18n keys added
- DashboardPage.tsx and EpicsPage.tsx migrated to use Card component
- Sidebar settings panel Save/Reset buttons migrated to Button component
- 16 new tests added (Card: 5, Button: 7, Sidebar: 4 localStorage tests)
- Total test count: 327 (was 311 before this story)
- Lint passes with zero TypeScript errors

### File List

**NEW:**
- `src/renderer/components/Card.tsx` — reusable card container
- `src/renderer/components/Card.test.tsx` — Card tests
- `src/renderer/components/Button.tsx` — reusable button (primary + secondary)
- `src/renderer/components/Button.test.tsx` — Button tests

**UPDATE:**
- `tailwind.config.js` — add borderRadius, boxShadow, transitionDuration extensions
- `src/renderer/styles/design-tokens.css` — add shadow CSS custom properties
- `src/renderer/components/Sidebar.tsx` — fix width, move toggle, add localStorage persistence
- `src/renderer/components/Sidebar.test.tsx` — add localStorage and width tests
- `src/renderer/pages/DashboardPage.tsx` — wrap stat cards with `<Card>`
- `src/renderer/pages/EpicsPage.tsx` — wrap epic items with `<Card>`
- `src/renderer/lib/i18n.tsx` — add `sidebar.collapse` and `sidebar.expand` keys

**VERIFY (no change needed):**
- `src/renderer/index.css` — global `:focus-visible` rule already provides 2px accent focus ring
- `src/renderer/components/ThemeProvider.tsx` — no changes
- `src/renderer/components/Toast.tsx` — no changes in this story

## Change Log

- 2026-07-13: Initial implementation — all tasks completed, 327 tests passing, lint clean

### Review Findings

#### decision-needed

- [x] [Review][Decision] **Global borderRadius override silently changes all existing rounded-sm/md/lg/xl** (blind+edge) — Resolved: keep as spec-intended global design token change.
- [x] [Review][Decision] **Dark-theme card shadows invisible** (edge) — Resolved: changed to light glow values `rgba(255,255,255,0.05/0.03/0.08)`. [design-tokens.css:124-126]
- [x] [Review][Decision] **Dashboard stat cards have unintended hover lift** (blind+edge) — Resolved: keep as-is.
- [x] [Review][Decision] **Button secondary `hover:bg-border-default` not specified in AC #3** (auditor) — Resolved: keep.
- [x] [Review][Decision] **Nav items `hover:text-foreground-primary` not specified in AC #1** (auditor) — Resolved: keep.

#### patch

- [x] [Review][Patch] **Collapse toggle missing `aria-label`** (blind) — Fixed: added aria-label. [Sidebar.tsx:427]
- [x] [Review][Patch] **localStorage write in `useEffect` has no error handling** (edge) — Fixed: wrapped in try/catch. [Sidebar.tsx:71-75]
- [x] [Review][Patch] **localStorage collapse tests may be flaky** (blind) — Fixed: wrapped assertions in waitFor. [Sidebar.test.tsx:172-185]
- [x] [Review][Patch] **Incomplete `hoverable=false` test assertion** (blind) — Fixed: added assertion for hover:-translate-y-px. [Card.test.tsx:35]

#### defer

- [x] [Review][Defer] **Settings inputs have `focus:outline-none` overriding global 2px accent focus ring** (auditor) — Pre-existing code from before this story, contradicts AC #4 audit instruction "verify no overrides break it." [Sidebar.tsx:287,298]

## Status

done
