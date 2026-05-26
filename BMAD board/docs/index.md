# Project Documentation Index

**Project:** BMAD Board
**Type:** Monolith — Web Application
**Generated:** 2026-05-26
**Scan Level:** Deep

## Project Overview

- **Name:** BMAD Board
- **Type:** Monolith (single Next.js application)
- **Primary Language:** TypeScript 5.3
- **Framework:** Next.js 14 (App Router)
- **Architecture:** Layered Component Architecture

## Quick Reference

- **Tech Stack:** Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Entry Point:** `src/app/page.tsx` (Dashboard)
- **API Entry:** `src/app/api/` (7 route groups)
- **Data Store:** `src/lib/store.ts` (in-memory, Map-based)
- **Markdown Sync:** `src/lib/markdown-parser.ts` (712 LOC)
- **Server Port:** 3333

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)

## Existing Documentation

- [README](../../README.md) — Full project documentation: features, installation, API endpoints, tech stack, screenshots

## Getting Started

```bash
cd "D:\Repos\BMAD-Board\BMAD board"
npm install
npm run dev
```

Open [http://localhost:3333](http://localhost:3333)

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PATCH/DELETE | `/api/epics` | Epic CRUD |
| GET/POST/PATCH/DELETE | `/api/stories` | Story CRUD |
| GET | `/api/tasks` | List tasks |
| GET/PUT | `/api/docs/[id]` | Document management |
| GET/PATCH/DELETE | `/api/config` | Runtime configuration |
| POST | `/api/sync` | Re-sync from filesystem |
| GET | `/api/diagnostics` | Health checks |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/store.ts` | In-memory data store (334 lines) |
| `src/lib/markdown-parser.ts` | BMAD markdown sync engine (712 lines) |
| `src/lib/types.ts` | TypeScript type definitions (118 lines) |
| `src/lib/config.ts` | Runtime configuration (72 lines) |
| `src/lib/i18n.tsx` | Internationalization EN/RU (443 lines) |
