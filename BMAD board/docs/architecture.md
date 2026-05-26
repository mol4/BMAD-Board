# Architecture

**Part:** root (Web Application)
**Generated:** 2026-05-26

## Executive Summary

BMAD Board is a local Jira-like project management UI built with Next.js 14 that reads and writes directly from BMAD Method markdown artifacts. It provides an interactive interface for managing epics, stories, tasks, and planning documents without requiring a database — all data is synchronized from markdown files on disk.

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 14.2+ |
| Language | TypeScript | 5.3+ |
| UI Library | React | 18.3+ |
| Styling | Tailwind CSS | 3.4+ |
| Typography | @tailwindcss/typography | 0.5.19 |
| Icons | @heroicons/react | 2.1.0 |
| Markdown Parsing | marked | 12.0.0 |
| Frontmatter Parsing | gray-matter | 4.0.3 |
| YAML Parsing | js-yaml | (via gray-matter) |
| ID Generation | uuid | 9.0.0 |

## Architecture Pattern

**Layered Component Architecture** with Next.js App Router

```
┌─────────────────────────────────────────────────────┐
│                   UI Layer (Pages)                   │
│  Dashboard | Board | Backlog | Epics | Stories | Docs│
├─────────────────────────────────────────────────────┤
│               Component Layer                        │
│     Sidebar | StatusBadge | CreateModal | Providers  │
├─────────────────────────────────────────────────────┤
│                  API Layer                           │
│  /api/epics | /api/stories | /api/docs | /api/config │
├─────────────────────────────────────────────────────┤
│               Business Logic Layer                   │
│         Store | Markdown Parser | Config | i18n      │
├─────────────────────────────────────────────────────┤
│               Data Layer (File System)               │
│     _bmad-output/planning-artifacts/*.md            │
│     _bmad-output/implementation-artifacts/*.md      │
│     sprint-status.yaml                               │
└─────────────────────────────────────────────────────┘
```

## Data Architecture

### In-Memory Store

- **Pattern:** Singleton with `globalThis.__store` for hot-reload persistence
- **Storage:** JavaScript `Map` collections for O(1) lookups
- **Entities:** Epic, Story, Task, Sprint
- **Auto-recalculation:** Epic status derived from child story statuses

### File System Sync

- **Direction:** Bidirectional (read from disk → memory, write status changes → disk)
- **Trigger:** Lazy initialization on first API call (`ensureInit()`)
- **Formats:** Markdown with YAML frontmatter + YAML sprint status
- **Modes:** `flat` (all stories in one folder) or `nested` (stories in epic subdirs)

### Markdown Parsing Strategy

1. **Epics:** Parse `epics.md` (aggregated) or individual `.md` files
2. **Stories:** Parse individual `.md` files from implementation-artifacts
3. **Inline Stories:** Extract stories embedded within `epics.md` under `### Story N.N:` headings
4. **Sprint Status:** Parse `sprint-status.yaml` for status synchronization

## API Design

### RESTful CRUD

All entities follow standard REST patterns:
- `GET` — List or retrieve single resource
- `POST` — Create new resource
- `PATCH` — Update resource (supports partial updates)
- `DELETE` — Delete resource

### Special Endpoints

- `/api/sync` — Trigger filesystem re-sync
- `/api/config` — Runtime configuration (no restart required)
- `/api/diagnostics` — Health check and data summary

### Error Handling

- `400` — Invalid request body or missing required fields
- `404` — Resource not found
- All errors return JSON: `{ "error": "message" }`

## Component Overview

### Pages (src/app/)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Project overview with epics, stories, progress bars |
| Sprint Board | `/board` | Kanban board with drag-and-drop columns |
| Backlog | `/backlog` | Story list with filtering |
| Epics | `/epics` | Epic list with detail pages |
| Stories | `/stories/[id]` | Story detail view |
| Documents | `/docs` | Planning document browser/editor |
| Diagnostics | `/diagnostics` | System health and data summary |

### Shared Components (src/components/)

| Component | Purpose |
|-----------|---------|
| `Sidebar` | Navigation sidebar with path settings |
| `StatusBadge` | Color-coded status display |
| `CreateModal` | Generic modal for creating epics/stories/tasks |
| `Providers` | React context providers (i18n) |

### Library Modules (src/lib/)

| Module | Purpose | Lines |
|--------|---------|-------|
| `store.ts` | In-memory data store with CRUD operations | 334 |
| `markdown-parser.ts` | BMAD markdown sync engine | 712 |
| `types.ts` | TypeScript interfaces and type definitions | 118 |
| `config.ts` | Runtime configuration management | 72 |
| `i18n.tsx` | Internationalization (EN/RU) | 443 |

## Development Workflow

### Local Development

```bash
npm install
npm run dev          # Start dev server on port 3333
```

### Production Build

```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Linting

```bash
npm run lint         # ESLint check
```

## Deployment Architecture

- **Runtime:** Node.js 18+
- **Server:** Next.js standalone or Node server
- **Port:** 3333 (configurable)
- **Data:** File system (no database required)
- **State:** In-memory (resets on server restart, re-syncs from disk)

## Testing Strategy

No test files detected in the project. Recommended additions:
- Unit tests for `store.ts` CRUD operations
- Unit tests for `markdown-parser.ts` parsing logic
- Integration tests for API routes
- E2E tests for critical user flows
