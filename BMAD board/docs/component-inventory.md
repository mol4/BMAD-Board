# Component Inventory

**Part:** root (Web Application)
**Generated:** 2026-05-26

## Overview

BMAD Board uses a minimal set of reusable UI components built with React and Tailwind CSS.

## Components

### CreateModal

**File:** `src/components/CreateModal.tsx`
**Type:** Form/Modal
**Purpose:** Generic modal dialog for creating epics, stories, and tasks

**Features:**
- Dynamic form fields based on entity type
- Validation for required fields
- Priority selector
- Labels input
- Story points (for stories)
- Assignee field

---

### Providers

**File:** `src/components/Providers.tsx`
**Type:** Context Wrapper
**Purpose:** Wraps application with React context providers

**Providers:**
- `I18nProvider` — Internationalization context (EN/RU)

---

### Sidebar

**File:** `src/components/Sidebar.tsx`
**Type:** Navigation
**Purpose:** Main navigation sidebar with path settings panel

**Features:**
- Navigation links (Dashboard, Board, Backlog, Epics, Documents, Diagnostics)
- Language switcher (EN/RU)
- Path settings (epicsDir, storiesDir, storiesMode)
- Sync button (re-sync from markdown files)
- Save/Reset configuration

---

### StatusBadge

**File:** `src/components/StatusBadge.tsx`
**Type:** Display
**Purpose:** Color-coded status badge for epics, stories, and tasks

**Status Colors:**
- `backlog` — Gray
- `todo` — Blue
- `in-progress` — Yellow/Orange
- `in-review` — Purple
- `done` — Green
- `draft` — Light gray
- `ready` — Teal

---

## Design System

### Styling Approach

- **Framework:** Tailwind CSS 3.4
- **Typography:** @tailwindcss/typography for markdown rendering
- **Icons:** @heroicons/react v2.1 (SVG icons)

### Color Palette

Derived from Tailwind default palette with status-specific mappings.

### Component Patterns

- All components use functional React components with hooks
- No class-based components
- Client components marked with `'use client'` directive
- Server components for API routes and page layouts
