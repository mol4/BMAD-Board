---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
date: 2026-03-24
---

# UX Design Specification — TaskFlow

**Author:** Designer
**Date:** 2026-03-24

---

## Executive Summary

### Project Vision

TaskFlow provides a clean, fast Kanban board for small teams. The interface prioritizes speed and clarity — users see their tasks instantly, update status with a single drag, and never wait for the UI. Every interaction should feel immediate.

### Target Users

**Primary — Alex (Team Lead)**

- 28–35, small team lead (3–8 developers)
- Frustrated by bloated tools; wants something that "just works"
- Needs: quick task overview, assign work, track progress
- First-session behavior: creates a project, adds a few tasks, drags one to "In Progress"

**Secondary — Jordan (Developer)**

- 25–30, individual contributor
- Wants to see assigned tasks, update status, move on
- Doesn't want to learn a complex UI — prefers familiar patterns

### Key Design Challenges

1. **Board performance** — must render 100+ task cards smoothly with drag-and-drop
2. **Information density** — show enough info per card (priority, assignee, due date) without clutter
3. **Real-time updates** — cards moving on the board from other users must not disrupt the current user's flow

---

## Core User Experience

### Defining Experience

The heart of TaskFlow is: **open board → see tasks → drag to update → done.**
No extra clicks, no modes, no configuration. The board is the product.

### Platform Strategy

- **MVP:** Desktop web only (minimum 1280×768 viewport)
- **Browsers:** Chrome, Firefox, Edge (last 2 major versions)
- **No mobile MVP** — drag-and-drop requires pointer precision

### Experience Principles

1. **Speed above all.** Every interaction completes in under 200ms. No loading spinners for board operations.
2. **One screen, one job.** The board is the primary view. Task details open in a side panel, not a new page.
3. **Clarity over decoration.** Priority is shown with color + icon (never color alone). Due dates use relative time ("in 2 days", "overdue").
4. **Real-time is invisible.** Updates from teammates flow in silently. No toast notifications for routine updates.

---

## Design System

### Color Palette

| Token              | Light Mode | Dark Mode  |
| ------------------ | ---------- | ---------- |
| `--primary`        | #3b82f6    | #60a5fa    |
| `--background`     | #ffffff    | #0f172a    |
| `--surface`        | #f8fafc    | #1e293b    |
| `--text-primary`   | #0f172a    | #f1f5f9    |
| `--text-secondary` | #64748b    | #94a3b8    |
| `--border`         | #e2e8f0    | #334155    |
| `--success`        | #22c55e    | #4ade80    |
| `--warning`        | #f59e0b    | #fbbf24    |
| `--danger`         | #ef4444    | #f87171    |

### Typography

- **UI font:** Inter (loaded via Fontsource)
- **Monospace:** JetBrains Mono (for code snippets, IDs)
- **Scale:** text-xs (12px) → text-xl (20px); base 14px

### Component Library

Built on **shadcn/ui** (Radix UI primitives) + **Tailwind CSS**.

### Priority Badges

| Priority | Color            | Icon |
| -------- | ---------------- | ---- |
| Critical | Red (#ef4444)    | 🔴   |
| High     | Orange (#f59e0b) | 🟠   |
| Medium   | Blue (#3b82f6)   | 🔵   |
| Low      | Slate (#94a3b8)  | ⚪   |

---

## Key Components

### TaskCard

- Compact card (min-height 72px) showing: title, priority badge, assignee avatar (24px circle), due date
- Hover: subtle shadow elevation + blue left border
- Drag state: card opacity 0.6 + placeholder outline in target column
- States: default, hover, dragging, dropping

### BoardColumn

- Header: column title + task count badge
- Fixed width 300px per column; horizontal scroll if viewport too narrow
- Drop zone highlights with dashed blue border when dragging over

### TaskDetailPanel

- Slides from right (300ms ease), 480px wide
- Full edit form: title, description (markdown), priority, assignee, due date
- "Delete" at bottom in red (requires click confirmation — not modal)
- Escape key closes

### CreateTaskModal

- Centered modal with backdrop blur
- Fields: title (required, autofocused), description, priority dropdown, assignee dropdown, due date picker
- Submit on Cmd+Enter from any field

### ThemeToggle

- Sun/moon icon button in the header
- Instant switch via CSS variables (no flash)
- Persisted in localStorage; system preference detected on first visit

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│ Header (48px): Logo · Project Selector · Theme · Avatar │
├─────────────────────────────────────────────────────┤
│ Board (flex-1, horizontal scroll)                    │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│ │ To Do│  │In Prg│  │Review│  │ Done │            │
│ │      │  │      │  │      │  │      │            │
│ │ Card │  │ Card │  │ Card │  │ Card │            │
│ │ Card │  │ Card │  │      │  │ Card │            │
│ │ Card │  │      │  │      │  │      │            │
│ └──────┘  └──────┘  └──────┘  └──────┘            │
├─────────────────────────────────────────────────────┤
│ (Optional) TaskDetailPanel slides from right         │
└─────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Shortcut    | Action                            |
| ----------- | --------------------------------- |
| N           | Open "Create Task" modal          |
| Escape      | Close panel / modal               |
| Cmd+Enter   | Submit form                       |
| /           | Focus search input                |
| 1–4         | Filter by column (1=To Do, etc.)  |

---

## Animations & Transitions

- **Card drag:** 200ms ease for drop animation
- **Panel slide:** 300ms ease-out from right
- **Modal open:** 200ms fade + scale(0.95 → 1.0)
- **Theme switch:** 150ms color transition on all elements
- **All animations** respect `prefers-reduced-motion`

---

## Empty States

- **No projects:** "Welcome to TaskFlow! Create your first project to get started." + large blue CTA button
- **No tasks:** "This board is empty. Click + to add your first task." + illustration of empty columns
- **No search results:** "No tasks match your search." + "Clear filters" link

---

## Error Patterns

- **Network error:** Persistent top banner "Connection lost. Retrying..." — auto-dismisses on reconnect
- **Form validation:** Inline red text below the field; no modals
- **Server error:** Toast notification "Something went wrong. Try again." with retry button
- **Drag failure:** Card snaps back to original position with 200ms animation
