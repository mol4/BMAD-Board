---
project_name: 'BMAD Board'
user_name: 'IvanM'
date: '2026-05-26'
sections_completed: ['technology_stack', 'language_specific_rules', 'framework_specific_rules', 'testing_rules', 'code_quality_rules', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 38
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Technologies
- **Next.js**: ^14.2.0 (App Router, dev server on port 3333)
- **React**: ^18.3.0 / **React DOM**: ^18.3.0
- **TypeScript**: ^5.3.0 (strict: true, target ES2017, moduleResolution: bundler)

### Key Dependencies
- **Tailwind CSS**: ^3.4.0 + @tailwindcss/typography ^0.5.19
- **gray-matter**: ^4.0.3 (markdown frontmatter parsing)
- **marked**: ^12.0.0 (markdown rendering)
- **uuid**: ^9.0.0 (ID generation via v4)
- **@heroicons/react**: ^2.1.0

### Critical Configuration Notes
- `tsconfig.json`: `jsx: "preserve"`, `noEmit: true`, `isolatedModules: true`, `paths: {"@/*": ["./src/*"]}`
- `next.config.js`: `serverComponentsExternalPackages: ["gray-matter"]`
- Server components by default; use `'use client'` directive for client-side code
- Tailwind config includes custom Jira color palette under `colors.jira.*`

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

**Configuration Requirements:**
- `strict: true` — avoid `any`, use precise types
- `isolatedModules: true` — each file must be a valid module
- `jsx: "preserve"` — Next.js handles JSX transformation

**Import/Export Conventions:**
- Use path alias `@/*` → `./src/*` (e.g., `import Sidebar from '@/components/Sidebar'`)
- Named exports for types (`export type Priority = ...`)
- Default exports for React components
- Import types from `@/lib/types`

**Error Handling:**
- Use try/catch with user-facing alerts for client errors
- API routes return JSON responses with appropriate HTTP status codes
- Handle fetch errors via `.catch` or try/catch blocks

**Store Pattern:**
- Singleton via `globalThis.__store` to prevent re-initialization on hot reload
- Use `Map` data structures for epics, stories, tasks, sprints
- Counter extraction from keys maintains sequential numbering (EPIC-1, STORY-1, etc.)

### Framework-Specific Rules (Next.js / React)

**App Router Conventions:**
- Pages in `src/app/` with `page.tsx` files
- API routes in `src/app/api/` with `route.ts` files
- Dynamic routes: `[id]/page.tsx`, `[id]/markdown/route.ts`
- Root layout in `src/app/layout.tsx` with Metadata export

**Component Structure:**
- Components in `src/components/` with PascalCase naming
- `'use client'` directive required for client-side components (Sidebar, CreateModal, etc.)
- Inline SVG icons used instead of libraries (except @heroicons/react)

**State Management:**
- In-memory Store class (`@/lib/store`) — does not persist between server restarts
- React hooks: `useState`, `useEffect`, `usePathname`, custom `useI18n`
- No external state library (no Redux, Zustand, etc.)

**Performance Rules:**
- Server components by default for optimal performance
- Client components only when interactivity is required
- Store singleton pattern prevents duplicate initialization during hot reload

### Testing Rules

**Framework:**
- **Vitest only** — no Jest, Cypress, Playwright, or other test frameworks
- Unit tests only — no E2E or integration tests

**Test Organization:**
- Place test files alongside source files with `.test.ts` or `.test.tsx` extension
- Example: `src/lib/store.test.ts` for `src/lib/store.ts`

**Mocking:**
- Mock the in-memory Store for component unit tests
- Use Vitest's `vi.fn()`, `vi.mock()` for function and module mocking
- Do not test against real Store state — isolate each test

**Test Structure:**
- Use `describe()` blocks for grouping related tests
- Use `it()` or `test()` with descriptive names
- Follow AAA pattern: Arrange, Act, Assert

### Code Quality & Style Rules

**Linting/Formatting:**
- `next lint` is the only lint script — uses Next.js default ESLint config
- No `.eslintrc` or `.prettierrc` files — rely on TypeScript strict mode for quality

**Code Organization:**
- `src/app/` — pages and API routes (App Router)
- `src/components/` — React components
- `src/lib/` — utilities, types, store, config
- Files: kebab-case for routes, PascalCase for components

**Naming Conventions:**
- Components: PascalCase (`Sidebar`, `CreateModal`, `StatusBadge`)
- Types/Interfaces: PascalCase (`Epic`, `Story`, `CreateStoryRequest`)
- API routes: lowercase with brackets for dynamic segments (`[id]/route.ts`)
- Variables/functions: camelCase

**Documentation:**
- No JSDoc comments in current codebase
- Frontmatter in markdown files documents epics/stories
- No README files in component directories

### Development Workflow Rules

**Git/Repository:**
- `.gitignore` excludes `node_modules/`, `.next/`
- No CI/CD workflows, Husky hooks, or commit conventions configured

**Deployment:**
- Dev: `npm run dev` (port 3333)
- Build: `npm run build`
- Start: `npm run start` (port 3333)
- No Docker or cloud deployment configs

### Critical Don't-Miss Rules

**Anti-Patterns to Avoid:**
- **DO NOT** use `any` — TypeScript strict mode requires precise types
- **DO NOT** add `'use client'` without necessity — server components are default
- **DO NOT** create new Store instances — use `globalThis.__store` singleton
- **DO NOT** use relative imports with `../../` — always use `@/*` alias
- **DO NOT** rely on in-memory Store persistence — data is lost on server restart

**Edge Cases:**
- Store counters must extract from existing keys to maintain sequential numbering
- Epic status auto-recalculates when story status changes
- Markdown files require valid frontmatter for gray-matter parsing

**Security:**
- API routes have no authentication — local development only
- No rate limiting or input validation on API endpoints

**Performance Gotchas:**
- `gray-matter` requires `serverComponentsExternalPackages` in next.config.js
- Tailwind JIT scanning configured for `./src/**/*.{js,ts,jsx,tsx,mdx}`

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-05-26
