---
name: BMAD Board
status: final
sources:
  - docs/project-overview.md
  - docs/architecture.md
  - docs/component-inventory.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/source-tree-analysis.md
  - docs/development-guide.md
  - _bmad-output/project-context.md
updated: 2026-05-27
form_factor: desktop-web
ui_system: null
---

# BMAD Board — Experience Spine

## Foundation

Desktop-only Electron application. React 18 SPA with React Router v6 and Zustand, running inside an Electron shell. Tailwind CSS with CSS custom properties for theming. No component library — the current build uses hand-rolled Tailwind utility classes. The visual identity reference is `DESIGN.md`; this spine defines behavior, information architecture, interactions, and flows.

**Content creation model (v1).** BMAD Board is a read-first application: the UI displays and allows status updates for epics, stories, and documents. Creating and deleting artifacts is the exclusive responsibility of BMAD AI agents — the app does not expose Create or Delete buttons for epics, stories, tasks, or documents. Manual editing of markdown source is allowed with a warning dialog, as a fallback for exceptional cases.

**Icon system.** Lucide (stroke-based, outline style) replaces `@heroicons/react` and all emoji icons. 18px default, 1.5px stroke width. Sidebar nav: `layout-dashboard`, `kanban`, `list`, `zap`, `file-text`, `activity`. Stat cards: `box`, `book-open`, `check-square`, `target`. Actions: `plus`, `refresh-cw`, `pencil`, `x`, `chevron-down`. Empty states: Lucide icons inside a `rounded.lg` tinted container — never bare emoji. This is a hard rule: zero emoji-as-icons in the product.

The app reads and writes BMAD Method markdown artifacts from the local filesystem. Data is in-memory, synced on demand. No authentication. Two users: IvanM (owner) and his team.

**Theme system.** `prefers-color-scheme` determines initial light/dark. A manual toggle in the sidebar persists to `localStorage`. Implementation: CSS custom properties on `:root` and `:root.dark`, toggled via class on `<html>`. All current `jira-*` Tailwind custom colors replaced by theme-aware CSS variables.

**i18n.** Existing EN/RU context system retained. Language labels follow the authoritative `@/lib/i18n` dictionary. `communication_language` is Russian; `document_output_language` is English.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Dashboard | `/` (app open) | Project overview: epics, stories, story points, completion stats, project docs |
| Sprint Board | `/board` | Kanban board: drag cards across status columns, filter by epic |
| Backlog | `/backlog` | Hierarchical story list grouped by epic, inline status change, create story |
| Epics | `/epics` | Epic list in card grid, click to detail |
| Epic detail | `/epics/[id]` | Epic info, story list, progress bars |
| Stories | `/stories/[id]` | Story detail with tasks, markdown tab, edit markdown source |
| Documents | `/docs` | Browse planning documents by category |
| Document detail | `/docs/[id]` | Rendered markdown with edit mode |
| Diagnostics | `/diagnostics` | File system and configuration health checks |

Sidebar provides top-level navigation to all surfaces. No command palette in v1. No mobile layout — desktop only.

## Voice and Tone

Microcopy in both EN and RU. Brand aesthetic posture lives in `DESIGN.md`.

| Do | Don't |
|---|---|
| "Sync markdown" / "Синхронизировать" | "Let's sync up! ✨" |
| "3 stories in progress" / "3 истории в работе" | "You have 3 active items." |
| "No epics yet. Add markdown files or create one." | "It's empty here 😢 Start by adding your first epic!" |
| Manager tone throughout. Direct, informative, calm. | Casual/slang tone in RU, corporate-speak in EN. |
| Use existing `i18n` dictionary keys. Extend carefully. | Rewrite existing translated strings without updating both locales. |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Sidebar | Global left rail | Expand/collapse toggle persists to `localStorage`. Active item highlighted with `{components.sidebar.active-background}`. Footer: settings panel, sync button, language toggle, theme toggle. Collapse to icons at 64px; reveal labels on expand. |
| Stat card | Dashboard | 4-card grid. Icon + label + value + optional subtitle. Click navigates to the relevant surface (epics, stories filtered). Hover: `translateY(-1px)` lift. |
| Status badge | Everywhere | Pill shape (`{components.status-badge.radius}`). Color pair from `status-*` tokens per theme. Translates label via i18n. |
| Priority badge | Backlog, stories, epics | `{components.priority-badge.radius}` shape. Filled circle icon (8px) + i18n label. Color from `{colors.priority-*}` tokens per theme. |
| Kanban card | Sprint Board | Draggable via HTML5 drag-and-drop. Drag state: `opacity: 0.5`, `scale: 0.95`. Drop zone: 2px dashed `accent` border with `accent-subtle` fill flash (200ms). Card click navigates to story detail. Shows: epic key, title, priority, story points, assignee avatar. |
| Kanban column | Sprint Board | 5 columns: backlog → todo → in-progress → in-review → done. Top-color strip (3px) matches status color. Column header shows count badge. Cards stack vertically, scrollable. |
| Create modal | Backlog, Epics, Stories | `{components.create-modal.radius}` dialog. Backdrop: overlay + `blur(4px)`. Form fields generated dynamically from schema. Validate required fields on submit. Escape closes. Focus trap active. Cancel button (secondary) left, submit button (primary) right. |
| Markdown renderer | Stories, Documents | Rendered markdown with `{components.markdown-renderer}` visual specs. Inline code: teal accent on tinted background. Code blocks: Catppuccin-palette syntax highlighting via highlight.js or Shiki. Mermaid diagrams: ````mermaid` fenced blocks render as SVG diagrams client-side (Mermaid.js). Diagram colors inherit theme: `foreground-primary` for text/labels, `accent` for highlights, `border-default` for edges. Light theme: white SVG bg. Dark theme: `surface-elevated-dark` SVG bg. Language badge ("mermaid") top-left, `caption` style. On render failure (invalid syntax, unsupported chart): fall back to raw monospace code block with inline `destructive` error banner. Edit mode: raw textarea with `{typography.mono}`, warning dialog before editing source files. |
| Epic card | Epics grid | 3-column card grid. Shows: key badge (`accent-light` bg), title, description preview (line-clamp-2), status badge, priority badge, progress bar, labels. Hover: shadow lift per `{components.epic-card.hover-shadow}`. Click navigates to epic detail. |
| Story detail tabs | Stories info/md | `{components.story-detail-tabs}` underline tab bar. Info tab: description, acceptance criteria (checklist), task list with checkboxes, sidebar metadata panel. Markdown tab: rendered content / raw editor toggle. Active tab: `accent` underline + foreground. |
| Theme toggle | Sidebar footer | `{components.theme-toggle.size}` icon button. Sun (light) / moon (dark) icon. Click toggles `dark` class on `<html>`. Default: `prefers-color-scheme`. Persisted to `localStorage('bmad-theme')`. |
| Button (primary) | Create actions, form submits, save | `{components.button-primary}` visual. Click triggers action. Active state: `scale(0.98)` with 80ms transition. Disabled: `opacity: 0.5`, `pointer-events: none`. |
| Button (secondary) | Cancel, dismiss, secondary actions | `{components.button-secondary}` visual. Same transition timing as primary. Disabled state same as primary. |
| Input / Select | Forms, filters, status changes | `{components.input}` visual. Focus: 2px `accent` ring, 1px offset. Placeholder in `foreground-tertiary`. Select: same treatment, dropdown arrow icon. Textarea: same borders, resizable vertical. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold app load | Any | Skeleton placeholders matching expected layout shape. Card skeletons (animated pulse in `surface-sunken`). Resolve on data fetch. |
| Empty dashboard | Dashboard | Stat cards show "0". Epic list shows empty state card with icon + "No epics yet. Run BMAD AI agents to generate artifacts." + link to "Add Project" if no project configured. |
| Empty backlog | Backlog | Empty state: "No stories yet." Epic headers still show if epics exist, with "No stories" under each. |
| Empty epics | Epics | Empty state card: "No epics yet. Run BMAD AI agents to generate artifacts." |
| Empty kanban | Sprint Board | Each column shows count 0. Column well is visible, spacious. |
| Empty docs | Documents | Category headers present, "No documents" in each group. |
| Empty diagnostics | Diagnostics | List of health checks with "not configured" or "no data" status indicators. |
| Data load error | Dashboard, Board, Backlog, Epics | Toast: "Failed to load data. Retrying…" with retry action. Skeleton remains. |
| Data save fails | Stories, Documents | Toast notification (destructive variant): "Couldn't save. Trying again." Content retained in form. |
| Sync in progress | Sidebar | Sync button replaces icon with spinner. Disabled until complete. |
| Sync fails | Sidebar | Toast: "Sync failed. Check file paths." with link to settings. |
| 404 / not found | Stories, Epics, Documents | Centered empty state: icon + "Not found" message + back link. |
| Drag in progress | Sprint Board | Card being dragged: `opacity: 0.5`, `scale: 0.95`, cursor: grabbing. Drop target column: dashed `accent` border. |
| Offline | Global | Not currently handled. Desktop-only, assumed always online for v1. |
| Update available | Global | Toast (default variant): "Update available" / "Доступно обновление" with download button. |
| Update downloading | Global | Toast with progress indicator. Auto-dismiss after download completes. |
| Update ready to install | Global | Modal (non-blocking): "Restart to update" / "Перезапустите для обновления" with "Restart now" (primary) and "Later" (secondary) buttons. Escape dismisses (same as "Later"). |
| Update check failed | Global | Silent fail. Retry on next launch. No user-facing notification for check failures. |

## Interaction Primitives

**Mouse-first, keyboard-augmented.** Desktop application; most interactions are mouse-driven (drag, click, select). Keyboard shortcuts supplement power users.

| Action | Binding | Surface |
|---|---|---|
| Navigate | Click sidebar item | Global |
| Status change | Select dropdown or drag | Backlog (select), Board (drag) |
| Edit markdown | Tab → edit button → warning → textarea | Stories, Documents |
| Theme toggle | Click sun/moon icon in sidebar | Global |
| Language toggle | Click RU/EN in sidebar | Global |
| Sync | Click sync button in sidebar | Global |
| Collapse sidebar | Click chevron | Sidebar |
| Update | Toast notification + restart modal | Global |

**Drag and drop.** Sprint Board uses HTML5 drag-and-drop. Drag ghost: card preview at reduced opacity. Drop feedback: column border flashes `accent` for 200ms on successful drop. Optimistic UI update: card moves immediately, PATCH request fires in background.

**Transitions.** Windows 11 style — snappy, minimal. Hover/active: 80–150ms `ease-out`. Modal enter/exit: 200ms `cubic-bezier(0.16, 1, 0.3, 1)` (Win11 spring). Sidebar collapse: 200ms `ease-out`. No bouncy/spring animations. No animation on status badge or priority badge changes.

**Banned everywhere:** infinite scroll (pagination only for documents if needed), loading spinners on full-page surfaces (use skeletons), emoji-as-icons (use Lucide icons instead).

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md`.

- WCAG 2.1 AA across both themes. All `status-*` foreground/bg pairs verified for 4.5:1 contrast ratio.
- Focus rings: 2px `accent` outline, 1px offset. Visible on all interactive elements. `Tab` order matches visual reading order.
- Keyboard: `Escape` closes modals. `Tab` navigates form fields. Drag-and-drop is mouse-only; status select dropdown provides keyboard alternative on Sprint Board.
- Drag-and-drop cards have `role="listitem"` and `aria-grabbed` state. Columns have `role="list"` with `aria-label` for status.
- Screen reader: landmark regions (`nav`, `main`, `complementary`). Page title updates on navigation. Status changes announced via `aria-live="polite"`.
- Language: `lang` attribute on `<html>` element switches between `en` and `ru` per user selection. No mixed-language rendering.

## Key Flows

### Flow 1 — Morning dashboard check (IvanM, project lead, 9:00am Monday)

1. IvanM opens BMAD Board in a browser tab. Theme follows system preference (dark if OS is dark).
2. Dashboard loads. Four stat cards animate in (skeleton → data). Story point completion bar fills.
3. Dashboard shows 3 epics, one "in-progress" with a teal progress bar at 60%.
4. IvanM clicks the in-progress epic. Navigates to Epic detail, sees which stories are `in-progress` and `in-review`.
5. **Climax:** From the epic detail, one story has the markdown file icon. IvanM clicks it, lands on the story's Markdown tab, and reviews the implementation spec. The code block within renders with proper syntax highlighting — teal keywords on dark background, not raw pink text. He switches back to Info tab, changes story status to `done`.
6. Dashboard re-renders after navigation back: the completion bar ticks up.

Failure: dashboard data fetch fails → skeleton persists, toast: "Failed to load data. Retrying…"

### Flow 2 — Sprint board status update (Alexei, developer, mid-sprint)

1. Alexei opens `/board`. Kanban columns load with cards. Epic filter defaults to the active epic.
2. He drags "Setup CI pipeline" from `todo` to `in-progress`. Card ghost appears, drop zone highlights with teal dashed border.
3. **Climax:** Card drops, PATCH request fires. Card instantly appears in the `in-progress` column. Column count badges update. No spinner, no page reload — the surface responds immediately.
4. Failure: network error → toast appears: "Couldn't save. Trying again." Card stays in the new column (optimistic UI); a retry icon pulses next to the card for 30 seconds.

### Flow 3 — Markdown document review (IvanM, reading a parsed spec)

1. IvanM navigates to `/docs`, sees documents grouped by category (planning-artifacts, implementation-artifacts).
2. Clicks an architecture document. Renders with proper heading hierarchy, teal-accented inline code, and dark Catppuccin code blocks.
3. **Climax:** Inline code reads `#0F766E` (light) or `#2DD4BF` (dark) — contextual, readable, not jarring pink. Code blocks have full syntax coloring. This is the fix for the "red text" pain point.
4. IvanM clicks Edit, gets warned about file editing, switches to raw markdown textarea with JetBrains Mono. Makes an edit, saves. Document re-renders in place.

Failure: save fails → toast: "Couldn't save. Trying again." Edit textarea retains content for retry.

### Flow 4 — Create a story from backlog (Sasha, teammate, Tuesday afternoon)

1. Sasha opens `/backlog`. Epics are expanded, stories listed underneath. She clicks "Create story" on the active epic.
2. Create modal opens with backdrop blur. She fills in title, description, priority (defaults to medium), and assigns 5 story points.
3. She submits. Modal closes, story appears in the backlog list under the epic. A brief `accent` highlight flashes on the new row (200ms).
4. **Climax:** The new story is immediately visible in the backlog with correct key numbering (STORY-2.3), and the epic's story count badge increments. She didn't have to reload or wait.

Failure: required field missing → inline validation error under the field, modal stays open. Network error → toast, modal closes, story not added.

## Concern Scan

- **Dark mode / Light mode.** Full dual-theme support via CSS custom properties. Design tokens defined for both. `prefers-color-scheme` + manual toggle.
- **Code syntax highlighting.** Catppuccin Mocha (dark) / Latte (light) palettes replacing the current `prose-code:text-pink-600`. Highlight.js or Shiki for rendering.
- **Mermaid diagram rendering.** All ````mermaid` fenced blocks render as SVG via Mermaid.js client-side. Theme-aware: diagram text/labels in `foreground-primary`, highlighted paths in `accent`, edges/shapes in `border-default`. Light background: `surface-elevated`. Dark background: `surface-elevated-dark`. Render failure falls back to raw code block with `destructive` error banner.
- **i18n.** Existing EN/RU system retained. All new microcopy must have both locales.
- **Desktop-only.** No responsive breakpoints for mobile. Single viewport target: 1024px+.
- **Accessibility.** Color pairs validated for AA contrast. Keyboard alternatives for drag-and-drop.
- **Toast system.** Needed for error/success feedback (currently uses `alert()`). Toast component: bottom-right, auto-dismiss 4s (success) / 8s (error), `{rounded.md}`, `surface-elevated` bg.
- **Priority color tokens.** `{colors.priority-critical}` through `{colors.priority-low}` with `-dark` variants defined in DESIGN.md frontmatter.