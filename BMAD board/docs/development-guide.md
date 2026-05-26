# Development Guide

**Part:** root (Web Application)
**Generated:** 2026-05-26

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ |

## Installation

```bash
npm install
```

## Environment Setup

No `.env` file required. Configuration is managed at runtime via the `/api/config` endpoint or the sidebar settings panel.

### Default Configuration

| Setting | Default Value |
|---------|---------------|
| `epicsDir` | `../_bmad-output/planning-artifacts` |
| `storiesDir` | `../_bmad-output/implementation-artifacts` |
| `storiesMode` | `flat` (auto-detected) |

## Local Development

```bash
npm run dev
```

Opens at [http://localhost:3333](http://localhost:3333)

## Build Commands

```bash
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

## Project Structure

```
src/
├── app/           # Next.js App Router (pages + API routes)
├── components/    # Reusable UI components
└── lib/           # Business logic and utilities
```

## Key Development Areas

### Adding a New API Endpoint

1. Create directory: `src/app/api/<resource>/`
2. Add `route.ts` with HTTP method handlers:
   ```typescript
   export async function GET(request: NextRequest) { ... }
   export async function POST(request: NextRequest) { ... }
   ```
3. Add corresponding store methods in `src/lib/store.ts`
4. Add types in `src/lib/types.ts`

### Adding a New Page

1. Create directory: `src/app/<page>/`
2. Add `page.tsx` with React component
3. Add navigation link in `Sidebar.tsx`
4. Add i18n translations in `lib/i18n.tsx`

### Adding a New Component

1. Create file: `src/components/<ComponentName>.tsx`
2. Use Tailwind CSS for styling
3. Export as default

### Modifying Data Models

1. Update types in `src/lib/types.ts`
2. Update store methods in `src/lib/store.ts`
3. Update markdown parser in `src/lib/markdown-parser.ts`
4. Update API routes as needed

## Testing

No test framework is currently configured. Recommended setup:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Test File Patterns

Place tests alongside source files:
- `*.test.ts` — Unit tests
- `*.test.tsx` — Component tests

## Code Conventions

- **Language:** TypeScript (strict mode)
- **Module System:** ES modules
- **Path Aliases:** `@/*` maps to `./src/*`
- **JSX:** Preserve (Next.js handles transformation)
- **Naming:** PascalCase for components, camelCase for functions/variables

## Common Tasks

### Sync Data from Markdown Files

Call `POST /api/sync` or click "Sync MD" in the sidebar.

### Change Artifact Paths

Call `PATCH /api/config` with new paths or use the sidebar settings panel.

### Add i18n Translation

Add key-value pairs to both `ru` and `en` objects in `src/lib/i18n.tsx`.
