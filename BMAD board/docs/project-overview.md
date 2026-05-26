# Project Overview

**Generated:** 2026-05-26

## BMAD Board

> A local Jira-like project management UI that reads directly from BMAD Method markdown artifacts.

## Executive Summary

BMAD Board is a companion tool for the BMAD Method ecosystem. It transforms flat markdown planning and implementation artifacts into an interactive project management interface, providing dashboard, Kanban board, backlog, epic/story management, document editing, and diagnostics — all without a database.

## Tech Stack Summary

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| UI | React 18.3 + Tailwind CSS 3.4 |
| Markdown | marked + gray-matter |
| Icons | @heroicons/react |

## Architecture

- **Type:** Monolith (single Next.js application)
- **Pattern:** Layered component architecture
- **Data:** In-memory store synced from filesystem markdown files
- **Server:** Node.js on port 3333

## Repository Structure

```
BMAD board/
├── src/app/           # Pages + API routes (Next.js App Router)
├── src/components/    # Reusable UI components (4)
├── src/lib/           # Business logic (store, parser, config, i18n, types)
├── docs/              # Generated project documentation
└── _bmad-output/      # BMAD artifacts (planning + implementation)
```

## Features

| Page | Description |
|------|-------------|
| Dashboard | Epics, stories, progress bars, story points overview |
| Sprint Board | Kanban columns with drag-and-drop |
| Backlog | Story list with filtering by epic, status, priority |
| Epics | Epic list with progress indicators and detail pages |
| Stories | Story detail with tasks, acceptance criteria, markdown editor |
| Documents | Browse and edit planning artifacts |
| Diagnostics | File system and configuration health checks |

## Generated Documentation

- [Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)

## Getting Started

```bash
cd "BMAD board"
npm install
npm run dev
```

Open [http://localhost:3333](http://localhost:3333)
