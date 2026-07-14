---
story_id: 5b-i.2
story_key: 5b-i-2-build-input-status-badge-and-priority-badge
epic: 5b-i
epic_name: Polished Navigation & Core UI
previous_story: 5b-i-1-build-sidebar-card-and-button-components
status: done
baseline_commit: d60adbf5a3bf8280cb61d6659a63ec27544012d7
---

# Story 5b-i.2: Build Input, Status Badge, and Priority Badge

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want consistent inputs and visual indicators for status and priority,
So that forms and lists are readable and scannable.

## Acceptance Criteria

1. **Given** a form or list view  
   **When** I see an Input or Select  
   **Then** it has elevated bg (light) / sunken-dark bg (dark), border-default 1px, `rounded.md`  
   **And** focus state: 2px accent ring, 1px offset  
   **And** placeholder text in foreground-tertiary  
   **And** Select dropdown uses same styling with arrow icon  
   **And** Textarea: same borders, resizable vertical

2. **Status Badge** is `rounded.full` pill, background/foreground from status palette per theme, caption font (12px/500).  
   **And** all status values render correctly: backlog, todo, in-progress, in-review, done, draft, ready

3. **Priority Badge** is `rounded.md` shape, filled circle icon (8px) + label, color from priority-* tokens per theme.  
   **And** all priority values render correctly: critical, high, medium, low

4. **All badge labels are i18n-translated** (EN/RU) and already exist in `src/renderer/lib/i18n.tsx`.

5. **Focus rings visible** on all inputs and badges (global `:focus-visible` rule in `index.css` provides 2px accent outline, 1px offset; do NOT add `focus:outline-none` to any input).

6. **Tailwind config verified** — `status.*` and `priority.*` tokens already mapped in `tailwind.config.js`; no config changes needed for this story unless gaps discovered during implementation.

7. **Vitest tests**: at least 5 new tests covering Input render + focus classes, Select render + arrow, Textarea render + resize, StatusBadge status variants, PriorityBadge priority variants.

## Tasks / Subtasks

- [x] **Task 1 — Create `src/renderer/components/Input.tsx`** (AC: #1, #5)
  - [x] Props: `value`, `onChange`, `placeholder?`, `disabled?`, `className?`, `type?` (default `'text'`), `id?`, `name?`, `autoFocus?`, `readOnly?`, plus rest spread for data-testid
  - [x] Base classes: `w-full px-3 py-2 bg-surface-elevated dark:bg-surface-sunken border border-border-default rounded-md text-body text-foreground-primary placeholder-foreground-tertiary transition-colors duration-80 ease-out`
  - [x] Focus ring: rely on global `:focus-visible` in `index.css` (2px accent outline, 1px offset). Do NOT add `focus:outline-none`.
  - [x] Export as default
  - [x] Write `Input.test.tsx`: renders with correct classes, spreads data-testid, disabled state

- [x] **Task 2 — Create `src/renderer/components/Select.tsx`** (AC: #1, #5)
  - [x] Props: `value`, `onChange`, `options: { value: string; label: string }[]`, `placeholder?`, `disabled?`, `className?`, `id?`, `name?`, plus rest spread
  - [x] Wrapper: same base styling as Input (bg, border, rounded, text, placeholder)
  - [x] Native `<select>` with custom arrow icon via `lucide-react` `ChevronDown` (absolute positioned right side, pointer-events-none) or use `appearance-none` with background-image arrow
  - [x] Prefer native `<select>` for accessibility; wrap in relative container with icon overlay
  - [x] Focus ring: rely on global `:focus-visible`
  - [x] Export as default
  - [x] Write `Select.test.tsx`: renders options, has chevron icon, disabled state

- [x] **Task 3 — Create `src/renderer/components/Textarea.tsx`** (AC: #1, #5)
  - [x] Props: `value`, `onChange`, `placeholder?`, `disabled?`, `className?`, `id?`, `name?`, `rows?` (default 4), plus rest spread
  - [x] Base classes: same as Input + `resize-y min-h-[80px]`
  - [x] Focus ring: rely on global `:focus-visible`
  - [x] Export as default
  - [x] Write `Textarea.test.tsx`: renders with correct classes, resize-y present, rows default

- [x] **Task 4 — Update `StatusBadge.tsx` to match UX-DR10 exactly** (AC: #2, #4, #5)
  - [x] Verify `rounded-full` pill shape already present
  - [x] Verify caption sizing: current `text-xs font-medium` may need `text-caption` (maps to 12px/500 via tailwind config) instead of `text-xs font-medium`
  - [x] Keep `px-2.5 py-0.5` or adjust per DESIGN.md if specified differently
  - [x] Ensure `inline-flex items-center` layout
  - [x] Update `StatusBadge.test.tsx` to assert all status variants render correct bg/fg classes

- [x] **Task 5 — Update `PriorityBadge` in `StatusBadge.tsx` to match UX-DR17** (AC: #3, #4, #5)
  - [x] Change wrapper to `rounded-md` shape (currently no rounded class)
  - [x] Replace outline Lucide icons (`AlertOctagon`, `ArrowUp`, `Minus`, `ArrowDown`) with **filled circle** icons (8px). Use `lucide-react` `Circle` with `fill="currentColor"` and `size={8}` to create filled-dot effect, OR use inline `<span className="w-2 h-2 rounded-full bg-current" />` (cleaner, no icon dependency).
  - [x] The filled circle should use the priority color token as both foreground (text) and fill color.
  - [x] Keep `inline-flex items-center gap-1.5` layout
  - [x] Label uses `text-caption` or `text-xs font-medium`
  - [x] Add i18n keys if any missing (RU/EN already exist for `priority.*`)
  - [x] Update tests for PriorityBadge variants

- [x] **Task 6 — Migrate existing raw inputs to new components** (AC: #1, #5)
  - [x] `Sidebar.tsx` settings panel (3 inputs): replace raw `<input>` with `<Input>` — **CRITICAL**: remove `focus:outline-none` from current classes so global focus ring works. This fixes the deferred issue from 5b-i.1 review.
  - [x] `AddProjectModal.tsx` (3 inputs): replace raw `<input>` with `<Input>`
  - [x] `CreateModal.tsx` (1 input, 1 textarea, 1 select): replace with `<Input>`, `<Textarea>`, `<Select>`
  - [x] `EditWarningDialog.tsx` (1 input): checkbox input — skipped (Input component is for text/select/textarea only)
  - [x] `WelcomePage.tsx` (2 inputs): replace with `<Input>`
  - [x] `BoardPage.tsx` (1 select): replace with `<Select>`
  - [x] `BacklogPage.tsx` (1 select): replace with `<Select>`
  - [x] `StoryDetailPage.tsx` (1 select): replace with `<Select>`
  - [x] `MarkdownModal.tsx` (1 textarea): replace with `<Textarea>`

- [x] **Task 7 — Write / update tests** (AC: #7)
  - [x] `Input.test.tsx` (new): render + classes, disabled, focus-visible
  - [x] `Select.test.tsx` (new): render options, ChevronDown icon, change event
  - [x] `Textarea.test.tsx` (new): render + classes, resize-y, rows
  - [x] `StatusBadge.test.tsx` (update): assert `rounded-full`, `text-caption`, all status bg/fg tokens
  - [x] `PriorityBadge.test.tsx` (update or split): assert `rounded-md`, filled dot (8px), all priority colors

- [x] **Task 8 — Final verification** (AC: all)
  - [x] `npm run dev` — visually verify input focus rings, select dropdowns, textarea resize, status badge pills, priority badge dots
  - [x] `npm run lint` — zero TypeScript errors
  - [x] `npm run test` — all existing + new tests pass (baseline: 327 tests from 5b-i.1)

## Dev Notes

### Critical Context from Previous Story (5b-i-1)

- **`project-context.md` is STALE** — it describes the old Next.js stack. The actual codebase is on branch `migrate-to-desktop` running **Electron + Vite**. Do NOT follow `project-context.md` for stack or architecture.
- `tailwind.config.js` is **CommonJS** (`module.exports`). Keep that format.
- `@/*` alias resolves to `src/renderer/*` in both Vite and Vitest.
- **327 tests pass** currently. This story should bring total to 332+.
- `lucide-react` is installed. Use Lucide icons only.
- **No `clsx` or `tailwind-merge`** installed. Use template literal string concatenation for conditional classes. Do NOT install new dependencies unless absolutely necessary.
- **Context pattern** (not Zustand) is the established pattern for UI-only state (see `Toast.tsx`, `ThemeProvider.tsx`). Input/Select state is controlled by parent — components are presentational.
- **Global focus ring** is defined in `src/renderer/index.css` via `:focus-visible` pseudo-class. Any `focus:outline-none` class on an element will **break accessibility** by suppressing this ring. The 5b-i.1 review deferred exactly this finding: "Settings inputs have `focus:outline-none` overriding global 2px accent focus ring" (pre-existing code). This story MUST fix it by migrating to the new `<Input>` component which omits `focus:outline-none`.

### Tailwind Token Status

`tailwind.config.js` already has everything needed:
- `borderRadius.md: '10px'` ✅
- `colors.surface.elevated`, `surface.sunken` ✅
- `colors.border.default` ✅
- `colors.foreground.primary`, `foreground.tertiary` ✅
- `colors.status.*.bg` / `*.fg` ✅
- `colors.priority.*` ✅
- `fontSize.caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }]` ✅ — use `text-caption` class

No tailwind config changes are expected for this story.

### Design Token Status

`src/renderer/styles/design-tokens.css` already defines all status and priority tokens for both light and dark themes. Verify tokens exist before use:
- Status: `status-backlog-bg/fb` through `status-ready-bg/fg` ✅
- Priority: `priority-critical` through `priority-low` ✅

### Component Architecture

**Input, Select, Textarea** are presentational components. They accept controlled props and spread rest to the underlying element. No internal state.

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // no extra props needed — rest spread covers className, data-testid, etc.
}
```

Why not add `label` or `error` inside these components? Because the existing forms (Sidebar settings, AddProjectModal, CreateModal) manage their own label + error layout. Keeping Input/Select/Textarea as thin wrappers makes migration easier and matches the existing codebase pattern (see `Button.tsx` from 5b-i.1).

**Filled Circle for Priority Badge**

Instead of hunting for a filled-circle icon in Lucide, use a CSS circle:
```tsx
<span className={`inline-flex items-center gap-1.5 rounded-md text-caption font-medium text-priority-${priority}`}>
  <span className="w-2 h-2 rounded-full bg-current" />
  {label}
</span>
```
This is cleaner, no extra imports, and `bg-current` fills the dot with the text color (which comes from `text-priority-*`).

### Sidebar Focus Ring Fix (Deferred from 5b-i.1)

Current Sidebar inputs have:
```
className="... focus:border-accent focus:outline-none"
```
When migrating to `<Input>`, the new component does NOT include `focus:outline-none`, so the global `:focus-visible` ring will appear automatically. This fixes the deferred review finding.

### What NOT to Do (Deferred to Later Stories)

- **Toast polish** → Story 5b-i.3 (progress bar, etc.)
- **Theme toggle polish** → Story 5b-i.3
- **Kanban / Epic Card / Stat Card / Shiki / Mermaid** → Epic 5b-ii
- **CreateModal full redesign** → This story only replaces raw inputs inside CreateModal with new components; modal shell styling remains for later.
- **Remove dead i18n keys** → Deferred work per 5b-i.1 notes.

### References

- UX-DR9: Input / Select spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Input`]
- UX-DR10: Status Badge spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Status-Badge`]
- UX-DR17: Priority Badge spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Priority-Badge`]
- UX-DR24: Accessibility focus rings [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#Accessibility-Floor`]
- Architecture ADR-7: Icon system (Lucide) [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-7`]
- Architecture Theme System: CSS custom properties [Source: `_bmad-output/planning-artifacts/architecture.md#Theme-System-Architecture`]
- Previous story dev notes (5b-i-1): tailwind.config.js is CommonJS, `@/*` alias, test count=327, no clsx/tailwind-merge, global focus ring exists [Source: `_bmad-output/implementation-artifacts/5b-i-1-build-sidebar-card-and-button-components.md`]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Created `Input.tsx` — presentational text input with theme-aware styling, no focus:outline-none
- Created `Select.tsx` — native select with ChevronDown icon overlay, appearance-none
- Created `Textarea.tsx` — resizable textarea with same base styling as Input
- Updated `StatusBadge.tsx` — changed `text-xs font-medium` to `text-caption`, verified `rounded-full` pill shape
- Updated `PriorityBadge` — changed to `rounded-md`, replaced Lucide icons with CSS filled dot (`w-2 h-2 rounded-full bg-current`)
- Migrated 8 files from raw inputs to new components (Sidebar, AddProjectModal, CreateModal, WelcomePage, BoardPage, BacklogPage, StoryDetailPage, MarkdownModal)
- Fixed Sidebar `focus:outline-none` issue (deferred from 5b-i.1 review) — new Input component omits focus:outline-none, global :focus-visible ring now works
- Created StatusBadge.test.tsx with I18nProvider wrapper for proper translation testing
- All 368 tests pass (baseline was 327 from 5b-i.1, target was 332+)
- TypeScript lint passes with zero errors
- EditWarningDialog checkbox input skipped — Input component is for text/select/textarea only

### File List

**NEW:**
- `src/renderer/components/Input.tsx` — theme-aware text input
- `src/renderer/components/Input.test.tsx` — Input tests (8 tests)
- `src/renderer/components/Select.tsx` — theme-aware native select with chevron
- `src/renderer/components/Select.test.tsx` — Select tests (7 tests)
- `src/renderer/components/Textarea.tsx` — theme-aware textarea
- `src/renderer/components/Textarea.test.tsx` — Textarea tests (7 tests)
- `src/renderer/components/StatusBadge.test.tsx` — StatusBadge + PriorityBadge tests (19 tests)

**UPDATE:**
- `src/renderer/components/StatusBadge.tsx` — StatusBadge: `text-caption`; PriorityBadge: `rounded-md`, filled dot, removed unused Lucide icon imports
- `src/renderer/components/Sidebar.tsx` — migrated 3 raw inputs to `<Input>`, removed `focus:outline-none`
- `src/renderer/components/AddProjectModal.tsx` — migrated 3 raw inputs to `<Input>`
- `src/renderer/components/CreateModal.tsx` — migrated 1 input, 1 select, 1 textarea to new components
- `src/renderer/components/MarkdownModal.tsx` — migrated 1 raw textarea to `<Textarea>`
- `src/renderer/pages/WelcomePage.tsx` — migrated 2 raw inputs to `<Input>`
- `src/renderer/pages/BoardPage.tsx` — migrated 1 raw select to `<Select>`
- `src/renderer/pages/BacklogPage.tsx` — migrated 1 raw select to `<Select>`
- `src/renderer/pages/StoryDetailPage.tsx` — migrated 1 raw select to `<Select>`

**VERIFY (no change needed):**
- `tailwind.config.js` — status/priority tokens already mapped
- `src/renderer/styles/design-tokens.css` — status/priority CSS variables already present
- `src/renderer/lib/i18n.tsx` — `status.*` and `priority.*` keys already present

## Change Log

- 2026-07-13: Initial story creation — comprehensive developer guide based on epic analysis, architecture compliance, and previous story learnings (5b-i.1)
- 2026-07-13: Story implementation complete — created Input/Select/Textarea components, updated StatusBadge/PriorityBadge, migrated 8 files, 368 tests passing
- 2026-07-13: Code review complete — 6 patches applied (see Review Findings), 17 findings dismissed, 3 deferred

### Review Findings

- [x] [Review][Patch] PriorityBadge crash on unknown priority — added `|| { color: 'text-foreground-tertiary' }` fallback [StatusBadge.tsx:36]
- [x] [Review][Patch] PriorityBadge dot missing `aria-hidden="true"` — added to decorative dot span [StatusBadge.tsx:40]
- [x] [Review][Patch] Select with empty options + disabled placeholder unusable — placeholder now only disabled when `options.length > 0` [Select.tsx:34]
- [x] [Review][Patch] Select silently shows first option on unknown value — added disabled `<option>` indicator for unmatched values [Select.tsx:39-42]
- [x] [Review][Patch] PriorityBadge missing i18n fallback — added `|| priority` [StatusBadge.tsx:37]
- [x] [Review][Patch] Input/Select/Textarea hardcoded `bg-surface-elevated` lost sunken depth in modals — added `sunken` prop, updated 5 consumers: AddProjectModal, CreateModal, MarkdownModal, BacklogPage, StoryDetailPage [Input.tsx, Select.tsx, Textarea.tsx]
- [x] [Review][Defer] Global `:focus-visible` outline may not follow `border-radius` — deferred, pre-existing CSS design decision
- [x] [Review][Defer] Select options `.map()` recreates array every render — deferred, minor optimization, arrays are small
- [x] [Review][Defer] No test for `className` override resolution — deferred, low priority enhancement
