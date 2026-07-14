---
baseline_commit: 5031e6c295b96743dc1b084b631b9f9a50f52e7b
---

# Story 1.1: Initialize Electron-Vite Project

Status: done

## Story

As a developer,
I want the Electron-Vite project initialized with the correct folder structure,
so that I have a working foundation for the desktop application.

## Acceptance Criteria

1. **Given** a fresh repository
   **When** the electron-vite scaffold is initialized
   **Then** `npm run build` completes with zero errors

2. **And** `npm run dev` launches both the main process (Electron) and renderer process (Vite dev server with HMR)

3. **And** the folder structure follows the Architecture spec:
   ```
   src/
   ├── main/           # Electron main process (index.ts entry)
   ├── preload/        # Preload scripts (index.ts, contextBridge)
   └── renderer/       # React SPA (index.html entry, main.tsx, App.tsx)
   ```

4. **And** TypeScript strict mode (`"strict": true`) is enabled in both root tsconfig.json and tsconfig.node.json

5. **And** Tailwind CSS v3 is configured with PostCSS and a working utility class (test: apply `bg-red-500` to App.tsx, verify it renders)

6. **And** `package.json` includes scripts: `dev`, `build`, `preview`, `test` — where `test` runs Vitest

7. **And** Vitest is installed and configured with at least one passing test (`src/renderer/App.test.tsx` renders without errors)

## Tasks / Subtasks

- [x] Task 1: Clean up Next.js artifacts (AC: all)
  - [x] 1.1 Remove Next.js-specific files: `next.config.js`, `next-env.d.ts`, `src/app/` directory, `.next/` directory
  - [x] 1.2 Remove Next.js from `package.json` dependencies/devDependencies (next, @types/react, @types/react-dom — these will be reinstalled as pure React deps later)
  - [x] 1.3 Preserve: `src/components/`, `src/lib/`, `docs/`, `_bmad/`, `_bmad-output/`, `.agents/`, `.claude/`, `.gitignore`

- [x] Task 2: Initialize Electron-Vite scaffold (AC: #1, #2, #3)
  - [x] 2.1 Install electron-vite core dependencies: `electron`, `electron-vite`, `vite`, `@vitejs/plugin-react`
  - [x] 2.2 Install Electron dev/build deps: `electron-builder` (for later), `typescript`
  - [x] 2.3 Create `electron.vite.config.ts` with main/preload/renderer config (see Architecture spec section "Selected Starter: electron-vite")
  - [x] 2.4 Create `src/main/index.ts` — Electron main process entry, createWindow with 1024x768 minimum, load renderer
  - [x] 2.5 Create `src/preload/index.ts` — contextBridge skeleton (empty for now, channels added in story 1-2)
  - [x] 2.6 Create `src/renderer/index.html` — HTML entry for Vite renderer
  - [x] 2.7 Create `src/renderer/main.tsx` — React entry point with ReactDOM.createRoot
  - [x] 2.8 Create `src/renderer/App.tsx` — minimal React component with Tailwind class proof
  - [x] 2.9 Verify `npm run dev` launches Electron window showing the App component
  - [x] 2.10 Verify `npm run build` produces distributable output without errors

- [x] Task 3: Configure TypeScript (AC: #4)
  - [x] 3.1 Create root `tsconfig.json` with `"strict": true`, `"target": "ESNext"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`, `"paths": {"@/*": ["./src/renderer/*"]}`
  - [x] 3.2 Create `tsconfig.node.json` extending root, targeting `src/main/` and `src/preload/` with Node types
  - [x] 3.3 Add `tsconfig.web.json` for `src/renderer/` with DOM lib
  - [x] 3.4 Verify `npx tsc --noEmit` passes with zero errors

- [x] Task 4: Configure Tailwind CSS (AC: #5)
  - [x] 4.1 Install: `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/typography`
  - [x] 4.2 Create `tailwind.config.js` — export a CJS config (not TS, Vite Tailwind plugin prefers JS)
  - [x] 4.3 Configure `content` paths: `['./src/renderer/**/*.{js,ts,jsx,tsx}']`
  - [x] 4.4 Create `postcss.config.js` with `tailwindcss` and `autoprefixer` plugins
  - [x] 4.5 Create `src/renderer/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;`
  - [x] 4.6 Import `index.css` in `src/renderer/main.tsx`
  - [x] 4.7 **DO NOT** add jira-* colors or any hardcoded colors — plain Tailwind defaults only (design tokens come in Epic 5a)

- [x] Task 5: Setup Vitest (AC: #6, #7)
  - [x] 5.1 Install: `vitest`, `@vitejs/plugin-react` (already installed), `jsdom` (for DOM testing)
  - [x] 5.2 Create `vitest.config.ts` — environment: 'jsdom', include: ['src/renderer/**/*.test.{ts,tsx}']
  - [x] 5.3 Add `"test": "vitest run"` script to `package.json`
  - [x] 5.4 Create `src/renderer/App.test.tsx` — renders App, asserts "Hello" text visible
  - [x] 5.5 Verify `npm run test` passes
  - [x] 5.6 Add test file pattern to `.gitignore` if dist/coverage needed (coverage dir)

- [x] Task 6: Final verification (AC: all)
  - [x] 6.1 Full clean build: `npm run build` passes
  - [x] 6.2 Dev mode: `npm run dev` launches Electron window
  - [x] 6.3 Tests: `npm run test` passes
  - [x] 6.4 Type check: `npx tsc --noEmit` passes
  - [x] 6.5 Preview: `npm run preview` works (if electron-vite supports it)

## Dev Notes

### Architecture Constraints (MUST follow)

These are extracted from `_bmad-output/planning-artifacts/architecture.md`. Violating any of these will cause cascading issues in later stories.

**Starter template:** electron-vite (`npm create electron-vite@latest`) — the project uses this as its foundation. The scaffold provides:
- Vite for renderer (fast HMR, optimized builds)
- esbuild for main process
- electron-builder integration for later packaging
- Auto-update via electron-updater (configured in Epic 6)
- TypeScript out of the box

**Folder structure** (from Architecture section "Project Organization"):
```
src/
├── main/          # Electron main process
│   └── index.ts   # Main entry (window creation, app lifecycle)
├── preload/       # Preload scripts
│   └── index.ts   # contextBridge for IPC (channels added in story 1-2)
├── renderer/      # React SPA (existing code will be migrated here in stories 1-3)
│   ├── index.html # Vite HTML entry
│   ├── main.tsx   # React entry point
│   ├── App.tsx    # Root component (React Router added in story 1-2)
│   └── index.css  # Tailwind directives
└── shared/        # Shared types between main/renderer (added in story 1-2)
```

**Dependency versions** (from Architecture):
- Electron: ^33 (or latest stable)
- React: ^18.3.0
- React DOM: ^18.3.0
- TypeScript: ^5.3.0
- Tailwind CSS: ^3.4.0
- Vite: latest compatible with electron-vite
- Vitest: latest stable

**Key anti-patterns to avoid** (from Architecture "Enforcement Guidelines"):
- DO NOT use `console.log` for logging — `electron-log` will be configured in story 1-4
- DO NOT add `@heroicons/react` — Lucide replaces it in Epic 5a
- DO NOT add hardcoded `jira-*` colors — plain Tailwind utilities only, design tokens come in Epic 5a
- DO NOT add `dark:` prefix classes — CSS custom properties will handle theming (Epic 5a)
- DO NOT create Next.js-style `page.tsx` or `layout.tsx` — React Router replaces App Router (story 1-2)
- DO NOT add Zustand, React Router, electron-typed-ipc, electron-log yet — those are story 1-2 and later
- DO NOT use `any` — TypeScript strict mode must pass with precise types

### Current Codebase Context (what exists now)

The project root currently contains a fully functional Next.js 14 web application:

**Existing files to PRESERVE (do NOT delete):**
- `src/components/` — Sidebar.tsx, StatusBadge.tsx, CreateModal.tsx, Providers.tsx
- `src/lib/` — store.ts, types.ts, markdown-parser.ts, config.ts, i18n.tsx
- `docs/` — project documentation (project-overview.md, architecture.md, etc.)
- `_bmad/` — BMad Method configuration and skills
- `_bmad-output/` — planning artifacts, sprint status, this story file
- `.agents/`, `.claude/` — BMad agent definitions
- `.gitignore` — update if needed, do NOT remove
- `postcss.config.js` — can be reused/adjusted for Vite
- Root configs outside Next.js scope — README.md, LICENSE, etc.

**Files to REMOVE:**
- `src/app/` — Next.js App Router pages and API routes (entire directory)
- `next.config.js` — Next.js configuration, not needed for Electron
- `next-env.d.ts` — Next.js types reference
- `.next/` — Next.js build output
- `tsconfig.tsbuildinfo` — Next.js incremental build cache

**Files to MODIFY:**
- `package.json` — replace Next.js deps/scripts with Electron+Vite deps/scripts
- `tsconfig.json` — replace Next.js config with Electron project config
- `tailwind.config.ts` → `tailwind.config.js` — convert to CJS, replace jira-* colors with plain Tailwind defaults

**Key existing source files to keep (for reference — do NOT modify in this story):**
- `src/lib/types.ts` — defines Epic, Story, Task, Sprint interfaces (used in story 1-3)
- `src/lib/store.ts` — in-memory Store with Map-based data (migrated in story 1-3)
- `src/lib/i18n.tsx` — EN/RU i18n (used in story 1-3)
- `src/lib/markdown-parser.ts` — gray-matter + marked parser (migrated in story 1-3)
- `src/lib/config.ts` — runtime configuration (migrated in story 1-3)

### Implementation Hands-on Details

**electron.vite.config.ts structure** (follow electron-vite docs for exact API, this is the expected shape):
```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: 'src/main/index.ts',
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: 'src/preload/index.ts',
      },
    },
  },
  renderer: {
    plugins: [react()],
    root: 'src/renderer',
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: 'src/renderer/index.html',
      },
    },
    resolve: {
      alias: {
        '@': '/src/renderer',
      },
    },
  },
});
```

**src/main/index.ts skeleton:**
```typescript
import { app, BrowserWindow } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'BMAD Board',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

**src/preload/index.ts skeleton:**
```typescript
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Channels will be added in story 1-2
});
```

**src/renderer/index.html:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BMAD Board</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

**src/renderer/main.tsx:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/renderer/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': '/src/renderer',
    },
  },
});
```

### Testing Standards (from project-context.md)

- **Framework:** Vitest only — no Jest, Cypress, Playwright
- **Location:** Test files alongside source files with `.test.ts` / `.test.tsx` extension
- **Pattern:** `describe()` blocks, `it()` / `test()` with descriptive names, AAA (Arrange, Act, Assert)
- **Mocking:** Use Vitest's `vi.fn()`, `vi.mock()` — isolate tests, test the real App component render

### References

- Architecture starter template evaluation: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation` (lines 637-728)
- Architecture project structure: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns` (lines 1099-1147)
- Architecture naming conventions: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns` (lines 1079-1098)
- IPC boundaries: `_bmad-output/planning-artifacts/architecture.md#IPC Boundaries` (lines 1471-1481)
- Epics Story 1.1 definition: `_bmad-output/planning-artifacts/epics.md#Story 1.1` (lines 262-277)
- Project context testing rules: `_bmad-output/project-context.md#Testing Rules` (lines 87-106)
- Project context anti-patterns: `_bmad-output/project-context.md#Critical Dont-Miss Rules` (lines 142-163)

## Dev Agent Record

### Agent Model Used

_Bmad Dev Story workflow (deepseek-v4-pro)_

### Debug Log References

- `npm run build` — `electron-vite build` succeeded, produced dist/main, dist/preload, dist/renderer
- `npm run test` — `vitest run` passed (1 test, 1 file)
- `npx tsc --noEmit -p tsconfig.json` — zero errors (renderer)
- `npx tsc --noEmit -p tsconfig.node.json` — zero errors (main + preload)
- `npx tsc --noEmit -p tsconfig.web.json` — zero errors (renderer + DOM lib)

### Completion Notes List

- Removed all Next.js-specific files: `next.config.js`, `next-env.d.ts`, `src/app/`, `.next/`, `tailwind.config.ts`, `tsconfig.tsbuildinfo`
- Preserved all existing source code in `src/components/` and `src/lib/` for later migration (story 1-3)
- Set up Electron-Vite with `electron@33.4.11`, `electron-vite@5.0.0`, `vite@5.4.21`
- Created scaffold: `src/main/index.ts` (BrowserWindow with 1024x768 min), `src/preload/index.ts` (contextBridge skeleton), `src/renderer/main.tsx` (ReactDOM.createRoot), `src/renderer/App.tsx` (Tailwind bg-red-500 proof)
- Configured triple tsconfig: root (`src/renderer/*`), node (`src/main/*` + `src/preload/*`), web (`src/renderer/*` + DOM lib)
- Set up Tailwind CSS v3 with PostCSS, plain defaults (no jira-* colors, no dark: prefixes — per architecture anti-pattern rules)
- Set up Vitest v2 with jsdom, one passing test (`App.test.tsx` renders "Hello BMAD Board")
- Added `@testing-library/react` and `@testing-library/jest-dom` for test rendering
- Build produces three bundles: dist/main (0.89 kB), dist/preload (0.11 kB), dist/renderer (214 kB JS + 10 kB CSS)
- Updated `.gitignore` to replace Next.js entries with Electron-Vite dist/ entries

### File List

- `package.json` (modified — replaced Next.js deps/scripts with Electron+Vite)
- `electron.vite.config.ts` (new — Electron-Vite build config)
- `tsconfig.json` (modified — replaced Next.js config with Electron project config)
- `tsconfig.node.json` (new — Node process TypeScript config)
- `tsconfig.web.json` (new — Renderer TypeScript config)
- `tailwind.config.js` (new — Tailwind config, CJS format)
- `postcss.config.js` (modified — Vite-compatible PostCSS)
- `vitest.config.ts` (new — Vitest config with jsdom)
- `.gitignore` (modified — replaced Next.js entries with dist/)
- `src/main/index.ts` (new — Electron main process entry)
- `src/preload/index.ts` (new — contextBridge skeleton)
- `src/renderer/index.html` (new — Vite HTML entry)
- `src/renderer/main.tsx` (new — React entry)
- `src/renderer/App.tsx` (new — minimal app component)
- `src/renderer/App.test.tsx` (new — render test)
- `src/renderer/index.css` (new — Tailwind directives)
- `src/renderer/env.d.ts` (new — Vite client types)
- `next.config.js` (deleted)
- `next-env.d.ts` (deleted)
- `tailwind.config.ts` (deleted — replaced by .js)
- `tsconfig.tsbuildinfo` (deleted)
- `src/app/` (deleted — entire Next.js App Router)

### Review Findings

- [x] [Review][Defer] `@heroicons/react` removed from deps but still imported in preserved `src/components/` — deferred to story 1-3 (Lucide migration)
- [x] [Review][Patch] Node types leaked into renderer tsconfig [tsconfig.web.json] — **FIXED**: removed `"types": ["node"]` from tsconfig.web.json
- [x] [Review][Patch] `lint` script only checks renderer code [package.json] — **FIXED**: changed to `tsc --noEmit && tsc --noEmit -p tsconfig.node.json`
- [x] [Review][Defer] `src/components/` and `src/lib/` not included in any tsconfig — deferred to story 1-3 (migration)
- [x] [Review][Defer] `'use client'` directives in preserved components — deferred to story 1-3 (migration)
- [x] [Review][Defer] `fetch('/api/...')` calls no longer have handlers in Electron — deferred to story 1-2 (IPC)
- [x] [Review][Defer] `@/lib/...` resolves to non-existent `src/renderer/lib/` — deferred to story 1-3 (migration)
- [x] [Review][Defer] `fs`/`path` modules unreachable from renderer — deferred to story 1-3 (migration)
- [x] [Review][Defer] `js-yaml` is transitive dep via electron-builder — deferred to story 1-3
- [x] [Review][Patch] `mainWindow` never nulled on window close — **FIXED**: added `mainWindow.on('closed', () => { mainWindow = null })` [src/main/index.ts:20-22]
- [x] [Review][Patch] `ELECTRON_RENDERER_URL` loaded without `app.isPackaged` guard — **FIXED**: changed to `if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL)` [src/main/index.ts:24]
- [x] [Review][Defer] No error handling on `app.whenReady().then(createWindow)` — deferred, not critical for scaffold
- [x] [Review][Defer] `document.getElementById('root')!` non-null assertion — deferred, HTML guarantees element exists
- [x] [Review][Defer] Empty `electronAPI` on `window` without TypeScript declaration — deferred to story 1-2 (typed IPC)
- [x] [Review][Defer] No `app.requestSingleInstanceLock()` — deferred, multi-instance out of scope
- [x] [Review][Patch] Tautological `toBeDefined()` assertion in App.test.tsx — **FIXED**: changed to `toBeInTheDocument()` using jest-dom matchers
