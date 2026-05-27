---
name: BMAD Board
description: Modern project management UI for BMAD Method markdown artifacts with Windows 11 aesthetic, rich dark mode with turquoise accents, and complementary light theme. Desktop web only.
colors:
  # --- Light theme ---
  surface-base: '#F8F9FB'
  surface-elevated: '#FFFFFF'
  surface-sunken: '#F0F1F5'
  surface-overlay: 'rgba(0,0,0,0.45)'
  foreground-primary: '#1A1D23'
  foreground-secondary: '#5A5F6B'
  foreground-tertiary: '#8B8FA3'
  foreground-on-accent: '#FFFFFF'
  accent: '#0D9488'
  accent-hover: '#0F766E'
  accent-light: '#CCFBF1'
  accent-subtle: '#F0FDFA'
  border-default: '#E2E4EA'
  border-strong: '#C9CDD6'
  status-backlog-bg: '#F1F1F4'
  status-backlog-fg: '#6B7280'
  status-todo-bg: '#DBEAFE'
  status-todo-fg: '#1E40AF'
  status-in-progress-bg: '#FEF3C7'
  status-in-progress-fg: '#92400E'
  status-in-review-bg: '#EDE9FE'
  status-in-review-fg: '#6D28D9'
  status-done-bg: '#D1FAE5'
  status-done-fg: '#065F46'
  status-draft-bg: '#F3F4F6'
  status-draft-fg: '#4B5563'
  status-ready-bg: '#CCFBF1'
  status-ready-fg: '#0F766E'
  code-inline-bg: '#F1F5F9'
  code-inline-fg: '#0F766E'
  code-block-bg: '#1E1E2E'
  code-block-fg: '#CDD6F4'
  destructive: '#EF4444'
  priority-critical: '#DC2626'
  priority-critical-dark: '#F87171'
  priority-high: '#EA580C'
  priority-high-dark: '#FB923C'
  priority-medium: '#D97706'
  priority-medium-dark: '#FBBF24'
  priority-low: '#2563EB'
  priority-low-dark: '#60A5FA'
  # --- Dark theme ---
  surface-base-dark: '#0F1117'
  surface-elevated-dark: '#181B23'
  surface-sunken-dark: '#0A0C12'
  surface-overlay-dark: 'rgba(0,0,0,0.60)'
  foreground-primary-dark: '#E8EAED'
  foreground-secondary-dark: '#9BA1B0'
  foreground-tertiary-dark: '#5C6170'
  foreground-on-accent-dark: '#FFFFFF'
  accent-dark: '#2DD4BF'
  accent-hover-dark: '#14B8A6'
  accent-light-dark: '#134E4A'
  accent-subtle-dark: '#1A2E2C'
  border-default-dark: '#2A2D3A'
  border-strong-dark: '#3D4150'
  status-backlog-bg-dark: '#1E1F26'
  status-backlog-fg-dark: '#9CA3AF'
  status-todo-bg-dark: '#1E2D45'
  status-todo-fg-dark: '#93C5FD'
  status-in-progress-bg-dark: '#2D2406'
  status-in-progress-fg-dark: '#FCD34D'
  status-in-review-bg-dark: '#2E1F5E'
  status-in-review-fg-dark: '#C4B5FD'
  status-done-bg-dark: '#0D2818'
  status-done-fg-dark: '#6EE7B7'
  status-draft-bg-dark: '#1E1F26'
  status-draft-fg-dark: '#9CA3AF'
  status-ready-bg-dark: '#1A2E2C'
  status-ready-fg-dark: '#2DD4BF'
  code-inline-bg-dark: '#232738'
  code-inline-fg-dark: '#2DD4BF'
  code-block-bg-dark: '#0A0C12'
  code-block-fg-dark: '#CDD6F4'
  destructive-dark: '#F87171'
  priority-critical-dark: '#F87171'
  priority-high-dark: '#FB923C'
  priority-medium-dark: '#FBBF24'
  priority-low-dark: '#60A5FA'
typography:
  display:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: 30px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: '-0.02em'
  h1:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: '-0.01em'
  h2:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.35'
    letterSpacing: '-0.01em'
  h3:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  caption:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
  mono:
    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace"
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.55'
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  gutter: 24px
  editorial-gap: 32px
  sidebar-width: 260px
  sidebar-collapsed: 64px
components:
  sidebar:
    background: '{colors.surface-elevated-dark}'
    background-light: '{colors.surface-elevated}'
    foreground: '{colors.foreground-primary-dark}'
    foreground-light: '{colors.foreground-primary}'
    active-background: '{colors.accent-dark}'
    active-foreground: '{colors.foreground-on-accent-dark}'
    border-right: '{colors.border-default-dark}'
    border-right-light: '{colors.border-default}'
  card:
    background: '{colors.surface-elevated}'
    background-dark: '{colors.surface-elevated-dark}'
    foreground: '{colors.foreground-primary}'
    foreground-dark: '{colors.foreground-primary-dark}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
    radius: '{rounded.lg}'
    shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
    shadow-dark: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)'
  button-primary:
    background: '{colors.accent}'
    background-dark: '{colors.accent-dark}'
    foreground: '{colors.foreground-on-accent}'
    foreground-dark: '{colors.foreground-on-accent-dark}'
    radius: '{rounded.md}'
    hover: '{colors.accent-hover}'
    hover-dark: '{colors.accent-hover-dark}'
  button-secondary:
    background: '{colors.surface-sunken}'
    background-dark: '{colors.surface-sunken-dark}'
    foreground: '{colors.foreground-primary}'
    foreground-dark: '{colors.foreground-primary-dark}'
    radius: '{rounded.md}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
  input:
    background: '{colors.surface-elevated}'
    background-dark: '{colors.surface-sunken-dark}'
    foreground: '{colors.foreground-primary}'
    foreground-dark: '{colors.foreground-primary-dark}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
    radius: '{rounded.md}'
    focus-ring: '{colors.accent}'
  status-badge:
    radius: '{rounded.full}'
    padding: '2px 10px'
    font: '{typography.caption}'
  priority-badge:
    radius: '{rounded.md}'
    padding: '2px 8px'
    font: '{typography.caption}'
  kanban-column:
    background: '{colors.surface-sunken}'
    background-dark: '{colors.surface-sunken-dark}'
    radius: '{rounded.lg}'
  kanban-card:
    background: '{colors.surface-elevated}'
    background-dark: '{colors.surface-elevated-dark}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
    radius: '{rounded.md}'
    shadow: '0 1px 2px rgba(0,0,0,0.06)'
    shadow-dark: '0 1px 2px rgba(0,0,0,0.3)'
  stat-card:
    background: '{colors.surface-elevated}'
    background-dark: '{colors.surface-elevated-dark}'
    foreground: '{colors.foreground-primary}'
    foreground-dark: '{colors.foreground-primary-dark}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
    radius: '{rounded.lg}'
    shadow: '{components.card.shadow}'
    shadow-dark: '{components.card.shadow-dark}'
    hover-shadow: '0 4px 12px rgba(0,0,0,0.1)'
    hover-shadow-dark: '0 4px 12px rgba(0,0,0,0.5)'
  epic-card:
    background: '{colors.surface-elevated}'
    background-dark: '{colors.surface-elevated-dark}'
    foreground: '{colors.foreground-primary}'
    foreground-dark: '{colors.foreground-primary-dark}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
    radius: '{rounded.lg}'
    hover-shadow: '0 4px 12px rgba(0,0,0,0.1)'
    hover-shadow-dark: '0 4px 12px rgba(0,0,0,0.5)'
  create-modal:
    background: '{colors.surface-elevated}'
    background-dark: '{colors.surface-elevated-dark}'
    foreground: '{colors.foreground-primary}'
    foreground-dark: '{colors.foreground-primary-dark}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
    radius: '{rounded.xl}'
    overlay: '{colors.surface-overlay}'
    overlay-dark: '{colors.surface-overlay-dark}'
    shadow: '0 25px 50px rgba(0,0,0,0.25)'
  markdown-renderer:
    inline-code-bg: '{colors.code-inline-bg}'
    inline-code-bg-dark: '{colors.code-inline-bg-dark}'
    inline-code-fg: '{colors.code-inline-fg}'
    inline-code-fg-dark: '{colors.code-inline-fg-dark}'
    block-bg: '{colors.code-block-bg}'
    block-bg-dark: '{colors.code-block-bg-dark}'
    block-fg: '{colors.code-block-fg}'
    block-fg-dark: '{colors.code-block-fg-dark}'
    radius: '{rounded.lg}'
    inline-radius: '{rounded.sm}'
  story-detail-tabs:
    active-border: '{colors.accent}'
    active-border-dark: '{colors.accent-dark}'
    active-foreground: '{colors.accent}'
    active-foreground-dark: '{colors.accent-dark}'
    inactive-foreground: '{colors.foreground-tertiary}'
    inactive-foreground-dark: '{colors.foreground-tertiary-dark}'
    border: '{colors.border-default}'
    border-dark: '{colors.border-default-dark}'
  theme-toggle:
    foreground: '{colors.foreground-secondary}'
    foreground-dark: '{colors.foreground-secondary-dark}'
    hover-background: '{colors.accent-subtle}'
    hover-background-dark: '{colors.accent-subtle-dark}'
    radius: '{rounded.md}'
    size: 36px
---

## Brand & Style

BMAD Board is a project management companion for the BMAD Method ecosystem. It transforms flat markdown planning artifacts into a living, interactive workspace. The visual identity draws from **Windows 11's Fluent Design** (acrylic surfaces, subtle depth, rounded geometry) and **macOS Ventura** (clean layering, restrained color) — a modern desktop application that feels at home on any OS.

The product posture is **tool, not toy**: no confetti, no gamification, no visual noise. Every pixel earns its place. The primary accent — **teal #0D9488 / #2DD4BF** — marks interactive elements, active states, and progress. It is never used decoratively. Dark mode is the hero; light mode is a clean, equal-first-class citizen. The `prefers-color-scheme` media query determines the initial theme; a manual toggle persists preference.

Code blocks and inline code receive first-class treatment: syntax-aware rendering with the **Catppuccin Mocha** palette for dark, **Catppuccin Latte** for light — never raw pink-on-white monospaced text.

## Colors

### Light theme

- **Surface hierarchy.** Three tonal layers: `surface-sunken` (#F0F1F5) for canvas backgrounds and kanban column wells, `surface-base` (#F8F9FB) for the main content area, `surface-elevated` (#FFFFFF) for cards, modals, and sidebar. This layering creates depth without shadows.
- **Accent (#0D9488 teal).** Primary buttons, active navigation, links, focus rings, status `done` and `ready`, checkbox fills, progress bars. Hover state `#0F766E`. Light tints: `accent-light` (#CCFBF1) for tinted backgrounds, `accent-subtle` (#F0FDFA) for hover fills.
- **Foreground.** Three levels: primary (#1A1D23) for headings and body, secondary (#5A5F6B) for labels and metadata, tertiary (#8B8FA3) for placeholders and disabled text.
- **Borders.** default (#E2E4EA) for subtle separation, strong (#C9CDD6) for active inputs and emphasis.
- **Destructive (#EF4444).** Delete confirmations, validation errors.

### Dark theme

- **Surface hierarchy.** `surface-sunken-dark` (#0A0C12) for canvas, `surface-base-dark` (#0F1117) for main content, `surface-elevated-dark` (#181B23) for cards and panels. The darkest shade is the deepest well; elevated surfaces are lighter.
- **Accent (#2DD4BF teal-light).** A brighter teal (#2DD4BF) for dark mode to maintain contrast against dark surfaces. Hover `#14B8A6`. Tinted backgrounds: `accent-light-dark` (#134E4A) and `accent-subtle-dark` (#1A2E2C).
- **Foreground.** Primary (#E8EAED), secondary (#9BA1B0), tertiary (#5C6170).
- **Borders.** default (#2A2D3A), strong (#3D4150). Subtle but present — no floating-in-void cards.
- **Code blocks.** Background #0A0C12 (same as sunken canvas = seamless blocks), text #CDD6F4 (Catppuccin Mocha base). Inline code: bg #232738, fg #2DD4BF (accent teal for readability).
- **Destructive (#F87171).** Slightly lighter red for dark readability.

### Status palette

Designed for both themes. Each status has a dedicated background/foreground pair per theme. The dual-pair approach guarantees AA contrast in both modes without relying on opacity tricks.

In light mode: pastel tints. In dark mode: deeply desaturated, low-key backgrounds with bright foregrounds. See frontmatter `status-*` tokens.

## Typography

**Inter** is the primary typeface across all roles — display, headings, body, caption. It provides a clean, geometric, slightly rounded feel that aligns with the Windows 11 / macOS aesthetic without requiring multiple font families. System font stack as fallback.

**JetBrains Mono** (with Cascadia Code and Fira Code as alternates) for all monospace contexts: code blocks, inline code, keys (EPIC-1, STORY-1.1), and terminal-like displays.

**Lucide** is the icon system. 18px default size, stroke-based (outline style), 1.5px stroke width. Replaces all `@heroicons/react` icons and emoji decorators currently in the codebase. Lucide ships as SVG or as a web font via `lucide-static` CDN. Icons must not be emoji or emoji-based — every decorative or functional icon comes from Lucide.

Icon usage rules:

| Context | Size | Weight | Examples |
|---|---|---|---|
| Sidebar navigation | 18px | 1.5px | `layout-dashboard`, `kanban`, `list`, `zap`, `file-text`, `activity` |
| Stat cards | 22–24px | 1.5px | Inside the colored icon badge circle |
| Inline actions | 16px | 1.5px | Edit, sync, copy, external link |
| Buttons (icon-only or with text) | 16px | 1.5px | `plus`, `chevron-down`, `x`, `check`, `refresh-cw` |
| Badges / indicators | 14px | 2px | `file`, `alert-circle`, `info` |
| Empty states | 36–48px | 1.5px | Inside a `rounded.lg` tinted container, not as bare emoji |

All emoji currently used as "icons" (⚡📖✅🎯📋📄😿) **must** be replaced with Lucide SVG/ font icons. Emojis render differently across OSes and break the visual identity.

Type ramp:

| Role | Size | Weight | Leading | Tracking |
|------|------|--------|---------|----------|
| display | 30px | 700 | 1.2 | -0.02em |
| h1 | 24px | 700 | 1.3 | -0.01em |
| h2 | 20px | 600 | 1.35 | -0.01em |
| h3 | 16px | 600 | 1.4 | — |
| body | 14px | 400 | 1.6 | — |
| body-sm | 13px | 400 | 1.5 | — |
| caption | 12px | 500 | 1.4 | — |
| mono | 13px | 400 | 1.55 | — |

## Layout & Spacing

Desktop-only. `max-w-7xl` (1280px) for main content areas with `{spacing.gutter}` (24px) padding.

**Sidebar**: 260px expanded, 64px collapsed. Fixed left, full viewport height. On dark theme the sidebar uses `surface-elevated-dark` (#181B23) — subtly lighter than the canvas but not jarring. On light theme: `surface-elevated` (#FFFFFF) with a 1px `border-default` right border.

**Grid gutters**: 16px on content areas (card grids), 24px outer padding.

**Kanban column width**: flexible `min-width: 280px`, columns split evenly via flexbox.

## Elevation & Depth

Windows 11 — soft, layered depth. No hard drop shadows as identity markers.

- **Cards**: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` (light), `0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)` (dark). Shadows are whispers, not statements.
- **Hover elevation**: cards lift to `0 4px 12px rgba(0,0,0,0.1)` (light) / `0 4px 12px rgba(0,0,0,0.5)` (dark) with a subtle `translateY(-1px)`.
- **Modals/overlays**: `0 25px 50px rgba(0,0,0,0.25)` with a backdrop blur `blur(4px)`.
- **Sidebar**: no shadow; identity via surface color contrast against the canvas.

Dark mode surfaces use **deliberate tonal steps** (10px between base/elevated/sunken in HSL lightness) rather than shadows for separation. Where shadows appear, they are deeper to maintain perception on dark backgrounds.

## Shapes

Corner radii follow the Windows 11 / macOS Ventura approach — generous rounding that reads "modern desktop app."

| Token | Value | Use |
|-------|-------|-----|
| sm | 6px | Badges, tags, input inner elements |
| md | 10px | Buttons, inputs, kanban cards, dropdowns |
| lg | 14px | Cards, panels, modals, sidebar sections |
| xl | 20px | Dialog containers, major hero sections |
| full | 9999px | Status badges, avatar circles, toggle pills |

## Components

### Sidebar

Left-rail navigation. `surface-elevated` (light) / `surface-elevated-dark` (dark) fill. Active item: `accent` background with `foreground-on-accent` text. Inactive items: `foreground-secondary` text, transparent background, hover shows `accent-subtle` fill. Collapse toggle in the bottom zone. Settings panel and language switch in the footer zone. Section divider between nav items and footer controls.

### Card

The universal container for content surfaces: dashboard stats, epic cards, story detail panels. `surface-elevated` fill, `border-default` 1px border, `rounded.lg` (14px) corners, default shadow. Hover state increases shadow and shifts up 1px. Dark mode: elevated fill, darker border, deeper shadow.

### Button — Primary

Accent fill, `foreground-on-accent` text, `rounded.md` (10px) corners. Hover: accent-hover. Active: scale(0.98) with 80ms Win11-snappy transition. No icon-only variants in v1.

### Button — Secondary

`surface-sunken` fill (light) / `surface-sunken-dark` (dark), `foreground-primary` text, `border-default` 1px border. Same transitions as primary.

### Input / Select

`surface-elevated` bg (light) / `surface-sunken-dark` bg (dark). `border-default` 1px border. Focus: 2px `accent` ring, offset 1px. `rounded.md` corners. Placeholder text in `foreground-tertiary`.

### Status Badge

`rounded.full` pill. Background/foreground pairs from the status palette per theme. Font: `caption` (12px, 500 weight).

### Kanban Column

`surface-sunken` fill, `rounded.lg` corners. Top border: a 3px solid status-color strip (matches column's status). Column header: `caption` weight, uppercase tracking.

### Kanban Card

Card component with `rounded.md` corners. Draggable: cursor grab/b grabbing. Dragging: opacity 0.5, scale 0.95. Drop target: dashed 2px `accent` border with `accent-subtle` fill flash (200ms).

### Code Block

`rounded.lg` corners. Light theme: `code-block-bg` (#1E1E2E) with `code-block-fg` (#CDD6F4) — Catppuccin Mocha. Dark theme: `code-block-bg-dark` (#0A0C12) same palette. Full syntax highlighting via a highlight.js or Shiki pipeline, not raw `marked` output. Inline code: `code-inline-bg` fill, `code-inline-fg` (#0F766E light, #2DD4BF dark), `rounded.sm` corners, `px 1.5 py 0.5` padding.

**Mermaid diagrams.** Fenced code blocks with the `mermaid` language tag render as SVG diagrams, not as raw code. Mermaid.js renders client-side within the markdown renderer pipeline. Diagram output inherits theme colors: `foreground-primary` for text and line labels, `accent` for highlighted paths, `border-default` for edges and shapes. Light theme diagrams use a white (`surface-elevated`) SVG background; dark theme diagrams use `surface-elevated-dark` (#181B23). Diagram container: `rounded.lg`, `code-block-bg` background (matching code block treatment for visual consistency). The language label badge ("mermaid") appears top-left in `caption` style, `foreground-tertiary`, `rounded.sm` background `surface-sunken`. If Mermaid rendering fails (invalid syntax, unsupported chart type), fall back to displaying the raw mermaid source in a monospace code block with an inline error banner in `destructive` color.

### Stat Card

Dashboard KPI card. Inherits Card visual properties. 4-card responsive grid. Icon badge (colored background circle, 48x48) in top-right, label in `caption` style, value in `h1` style, optional subtitle in `caption` with `foreground-tertiary`. Click navigates to the relevant surface. Hover: shadow lifts per `{components.stat-card.hover-shadow}`.

### Epic Card

Card grid item (3-column on desktop). Inherits Card visual properties. Key badge (`caption` mono, `accent-light` bg light / `accent-light-dark` bg dark), title in `h3`, description with `line-clamp-2` in `body-sm`, status badge, priority badge, progress bar (`accent` fill), labels row at bottom. Hover: shadow lifts per `{components.epic-card.hover-shadow}`, title color shifts to `accent`.

### Priority Badge

Inline status indicator. `rounded.md` (10px) corners, `{typography.caption}` font. Color coding per priority level: critical (`{colors.priority-critical}` icon + text), high (`{colors.priority-high}`), medium (`{colors.priority-medium}`), low (`{colors.priority-low}`). Dark theme uses `-dark` variants. Icon: filled circle (8px) prefix.

### Create Modal

Dialog overlay. `surface-elevated` background, `{components.create-modal.radius}` (20px) corners, `surface-overlay` backdrop with `blur(4px)`. Header bar with title + close icon. Form fields use Input component styling. Footer: secondary cancel button left, primary submit button right. Escape closes. Focus trap active.

### Markdown Renderer

Rendered markdown content area. Prose styling with `typography.body` base. Inline code: `{colors.code-inline-bg}` fill, `{colors.code-inline-fg}` text, `{rounded.sm}` corners, px 1.5 py 0.5. Code blocks: `{colors.code-block-bg}` background, `{colors.code-block-fg}` text, `{rounded.lg}` corners, full syntax highlighting via highlight.js or Shiki (Catppuccin Mocha dark, Catppuccin Latte light). Tables: clean borders from `border-default`. Headings: inherit from `typography.h1`–`h3`. Links: `accent` color, underline on hover. Mermaid diagrams: rendered as SVG inline within the markdown flow — see Code Block / Mermaid diagrams section above.

### Story Detail Tabs

Tabbed navigation bar. Horizontal underline style. Active tab: `accent` bottom border (2px) + `accent` foreground. Inactive: `foreground-tertiary` + transparent border. Icons inline with tab labels. Content area below with no top border (tabs + card border serve as divider).

### Theme Toggle

Icon button in sidebar footer (sun/moon). Reads `prefers-color-scheme` on first load, stores preference in `localStorage`, toggles `dark` class on `<html>` element. All color tokens switch via CSS custom properties.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `accent` teal for interactive elements, progress, and status emphasis only | Use teal decoratively, as section dividers, or as background fills for large areas |
| Respect `prefers-color-scheme` as default, allow manual override | Force one theme without escape hatch |
| Use tonal surface hierarchy (sunken < base < elevated) for depth | Use shadows as primary depth indicator — they supplement, not replace, tonal steps |
| Use Catppuccin-based syntax highlighting for all code blocks | Use the current `prose-code:text-pink-600` or raw monochrome code blocks |
| Render ````mermaid` fenced blocks as SVG diagrams with theme-aware colors | Show Mermaid source code as raw text, or silently skip Mermaid blocks |
| Fall back to raw code block with `destructive` error banner on Mermaid render failure | Show a broken image or blank space for invalid Mermaid syntax |
| Round corners at `md` (10px) minimum for interactive elements | Use sharp corners on buttons, inputs, or cards |
| Keep `foreground-tertiary` for disabled and placeholder states | Use `foreground-tertiary` for body text or important metadata |
| Use Win11-snappy transitions (80–150ms) for hover/active | Use 300ms+ slow transitions on interactive elements |
| Sidebar in `surface-elevated` for contrast against canvas | Make the sidebar the same color as the main canvas |
| Use Lucide stroke-based icons everywhere | Use emoji (⚡📖✅🎯📋) as icons, `@heroicons/react`, or custom hand-drawn SVGs |
| 18px default icon size, 16px for inline, 22-24px for stat cards | Mix icon sizes without a consistent scale |