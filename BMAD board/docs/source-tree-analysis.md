# Source Tree Analysis

**Part:** root (Web Application)
**Generated:** 2026-05-26

## Directory Structure

```
BMAD board/
├── src/
│   ├── app/                          # Next.js App Router (pages + API)
│   │   ├── api/                      # REST API endpoints
│   │   │   ├── config/               # Configuration API (GET/PATCH/DELETE)
│   │   │   ├── diagnostics/          # Diagnostics API (GET)
│   │   │   ├── docs/                 # Document management API
│   │   │   │   ├── [id]/             # Dynamic route: GET/PUT by ID
│   │   │   │   └── route.ts          # List documents
│   │   │   ├── epics/                # Epic CRUD API
│   │   │   │   ├── [id]/             # Dynamic route: GET/PUT/PATCH epic markdown
│   │   │   │   └── route.ts          # GET/POST/PATCH/DELETE epics
│   │   │   ├── stories/              # Story CRUD API
│   │   │   │   ├── [id]/             # Dynamic route: GET/PUT/PATCH story markdown
│   │   │   │   └── route.ts          # GET/POST/PATCH/DELETE stories
│   │   │   ├── sync/                 # Sync API (POST) — re-sync from filesystem
│   │   │   └── tasks/                # Tasks API (GET)
│   │   ├── backlog/                  # Backlog page
│   │   ├── board/                    # Sprint Board (Kanban) page
│   │   ├── diagnostics/              # Diagnostics page
│   │   ├── docs/                     # Documents browser page
│   │   │   ├── [id]/                 # Dynamic route: view/edit document
│   │   │   └── page.tsx              # Documents list
│   │   ├── epics/                    # Epics management page
│   │   │   ├── [id]/                 # Epic detail page
│   │   │   └── page.tsx              # Epics list
│   │   ├── stories/                  # Stories pages
│   │   │   └── [id]/                 # Story detail page
│   │   ├── globals.css               # Global styles (Tailwind)
│   │   ├── layout.tsx                # Root layout (Providers wrapper)
│   │   └── page.tsx                  # Dashboard (home page)
│   ├── components/                   # Reusable UI components
│   │   ├── CreateModal.tsx           # Generic create modal (epics/stories/tasks)
│   │   ├── Providers.tsx             # React context providers wrapper
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   └── StatusBadge.tsx           # Status badge component
│   └── lib/                          # Shared utilities and business logic
│       ├── config.ts                 # Runtime configuration management
│       ├── i18n.tsx                  # Internationalization (EN/RU)
│       ├── markdown-parser.ts        # BMAD markdown sync engine (712 LOC)
│       ├── store.ts                  # In-memory data store (334 LOC)
│       └── types.ts                  # TypeScript type definitions (118 LOC)
├── docs/                             # Project documentation (generated)
├── public/                           # Static assets
├── _bmad/                            # BMad Method configuration
├── _bmad-output/                     # BMad artifacts (planning & implementation)
├── .next/                            # Next.js build output
├── node_modules/                     # Dependencies
├── package.json                      # Project manifest
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
└── next-env.d.ts                     # Next.js type declarations
```

## Critical Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router — all pages and API routes |
| `src/app/api/` | REST API — 7 route groups (epics, stories, tasks, docs, config, sync, diagnostics) |
| `src/components/` | Reusable UI components (4 components) |
| `src/lib/` | Business logic: store, markdown parser, config, i18n, types |

## Entry Points

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Dashboard (home page) |
| `src/app/layout.tsx` | Root layout with Providers |
| `src/app/globals.css` | Global Tailwind styles |

## Key Files

| File | Description |
|------|-------------|
| `src/lib/store.ts` | Core in-memory data store (334 lines) |
| `src/lib/markdown-parser.ts` | BMAD markdown sync engine (712 lines) |
| `src/lib/types.ts` | TypeScript interfaces for all entities |
| `src/lib/config.ts` | Runtime configuration (epicsDir, storiesDir, storiesMode) |
| `src/lib/i18n.tsx` | Internationalization context provider (EN/RU) |
