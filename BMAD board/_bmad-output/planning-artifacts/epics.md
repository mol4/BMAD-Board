---
stepsCompleted: [1, 2, 3, 4]
workflowType: epics-and-stories
project_name: BMAD Board
user_name: IvanM
date: '2026-05-27'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-BMAD board-2026-05-26/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md
  - _bmad-output/project-context.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/component-inventory.md
  - docs/source-tree-analysis.md
  - docs/development-guide.md
---

# BMAD Board - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for BMAD Board, decomposing the requirements from the PRD, UX Design, and Architecture decisions into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR-1 — Electron Application Shell:** The application launches as a native desktop window on Windows, macOS, and Linux. Produces a single executable/installer per platform. Window opens with the dashboard view loaded. No browser or dev server required.

**FR-2 — React UI Reuse:** All existing React components (Sidebar, StatusBadge, CreateModal, pages) are reused within the Electron renderer process. Dashboard, Sprint Board, Backlog, Epics, Stories, Documents, and Diagnostics pages render with no visual regression beyond expected dark-theme adaptations. Tailwind CSS styling is preserved. Visual regression verified against screenshot baseline of current web version.

**FR-3 — Native Window Management:** The application supports standard desktop window behaviors (minimize, maximize, close, resize). Window state (size, position) is persisted and restored on relaunch. Close behavior: application quits on close (minimize to tray deferred to v2).

**FR-4 — Project Configuration Storage:** The application stores project configurations in a local SQLite database. Each project record contains: name, epics directory path, stories directory path, and user preferences. Data persists across application restarts. Database file is stored in the platform-appropriate user app data directory.

**FR-5 — Project Switcher:** A UI element allows users to view all configured projects and switch between them. Project switcher is accessible from the sidebar or top bar. Switching projects reloads the store from the selected project's artifact directories. The last-used project is automatically loaded on launch.

**FR-6 — Add / Remove Projects:** Users can add a new project by selecting artifact directories and remove existing projects. Adding a project validates that the selected directories exist and contain valid BMAD artifacts. Removing a project removes it from SQLite but does NOT delete the markdown files.

**FR-7 — Filesystem Watcher:** The application monitors artifact directories for file changes using fs.watch or a polling fallback. Changes to markdown files (create, modify, delete) are detected. The store is updated and the UI reflects changes within 30 seconds. Watcher is scoped to the active project's artifact directories only. If a file is locked by another process, retry once after 5 seconds; if still locked, surface a non-blocking error toast. If the watched directory is deleted or becomes inaccessible, the watcher stops gracefully without crashing the application.

**FR-8 — Manual Sync Fallback:** A manual sync button remains available for explicit re-sync triggers. Clicking the sync button forces an immediate re-read of all artifact files. Sync button shows a loading state during operation.

**FR-9 — Edit Functions Verification:** All CRUD operations on epics, stories, tasks, and documents write correctly to markdown files. Creating an epic writes a valid markdown entry with YAML frontmatter (title, status, description, priority) to the epics file. Updating a story status writes the change to the story's markdown file frontmatter and the file remains valid markdown. Deleting a story removes the story's markdown file from disk and removes references from sprint-status.yaml. Document edits save correctly to the target markdown file, preserving existing frontmatter and markdown structure. After any write operation, a re-sync confirms the change is reflected in the store.

**FR-10 — Manual Edit Warning:** Before a user manually edits a BMAD artifact through the document editor, a warning dialog is displayed. Warning text: "You are about to edit a file manually. This is bad practice. Use this only in exceptional cases. AI Agent editing is preferred." User must confirm to continue editing. Warning can be dismissed with a "Don't show again" option per session.

**FR-11 — Dark Theme:** The application renders in a dark color scheme by default. All pages (Dashboard, Board, Backlog, Epics, Stories, Documents, Diagnostics) are legible and visually coherent in dark mode. Status badge colors are adjusted for dark background readability. Markdown rendering in dark mode preserves contrast and readability.

**FR-12 — Windows 11 Design Language:** The UI follows Windows 11 design conventions. Rounded corners on cards, modals, and input fields. Subtle elevation and shadow effects. Fluent-like typography and spacing. Consistent with Windows 11 aesthetics while remaining functional on macOS and Linux.

**FR-13 — Auto-Update Mechanism:** The application checks for updates on launch and periodically thereafter. Updates are distributed via GitHub Releases at no cost. Users are notified when an update is available. Update downloads and installs without requiring manual file replacement. Update mechanism works on Windows, macOS, and Linux.

### Non-Functional Requirements

**NFR-1 (Performance):** Application startup time under 5 seconds on a typical development machine.

**NFR-2 (Reliability):** Filesystem watcher does not crash the application if watched directories are deleted or become inaccessible.

**NFR-3 (Portability):** Application runs on Windows 10/11 (x64), macOS 12+ (x64 + Apple Silicon), and major Linux distributions — Ubuntu 22.04+, Fedora 38+ (x64) without platform-specific configuration.

**NFR-4 (Security):** SQLite database and artifact files are stored in user-scoped directories; no network access is required for core functionality.

### Additional Requirements

**Technical Requirements from Architecture:**

- **Starter Template:** electron-vite (`npm create electron-vite@latest bmad-board -- --template react-ts`) — must be the first implementation story.
- **State Management:** Zustand for React state; StoreManager with Map<projectId, Store> for per-project isolation.
- **IPC Type Safety:** electron-typed-ipc for end-to-end type safety between main and renderer processes.
- **Conflict Resolution:** File lock mechanism with 30s auto-release timeout for concurrent UI + AI agent edits.
- **Logging & Diagnostics:** electron-log with file rotation, levels, and platform-appropriate log locations.
- **Theme System:** CSS custom properties with `:root` / `:root.dark` toggle via class on `<html>` element.
- **Typography:** Inter (UI) + JetBrains Mono (code) via @fontsource packages.
- **Icon System:** Lucide replacing @heroicons/react and all emoji decorators. Zero emoji-as-icons rule.
- **Code Highlighting:** Shiki with Catppuccin Mocha (dark) / Catppuccin Latte (light) themes.
- **Mermaid Rendering:** Mermaid.js client-side SVG rendering with theme-aware colors and error fallback.
- **SQLite Schema:** Projects table (id, name, epics_dir, stories_dir, last_used_at, created_at) + Preferences table (key, value).
- **Filesystem Watcher:** fs.watch + chokidar polling fallback at 30s interval in main process.
- **API Client Pattern:** ipcRenderer.invoke wrapper mimicking fetch API for minimal component refactoring.
- **React Router v6:** Replacing Next.js App Router with route components and useSearchParams.
- **Tailwind Integration:** Custom properties mapped in tailwind.config.js with darkMode: 'class'.
- **No embedded HTTP server:** IPC only, no local server needed.
- **Build Tooling:** Vite for renderer, esbuild for main, electron-builder for packaging and auto-update.
- **Testing:** Vitest for unit tests (no Jest, no Cypress, no Playwright).
- **Edge Cases:** 1000+ stories lazy parse, malformed markdown graceful skip, concurrent project switch debounce, 100 files changed simultaneously batch debounce.

### UX Design Requirements

**UX-DR1 — Theme Token System:** Implement CSS custom properties for all 50+ light/dark color pairs from DESIGN.md frontmatter. Replace all hardcoded `jira-*` Tailwind colors and `dark:` prefix duplication. Single `design-tokens.css` file with `:root` and `:root.dark` blocks.

**UX-DR2 — Surface Hierarchy:** Implement 3-tier tonal system — `surface-sunken` (canvas), `surface-base` (main content), `surface-elevated` (cards/panels). Shadows supplement, not replace, tonal steps.

**UX-DR3 — Typography System:** Load Inter and JetBrains Mono via @fontsource packages. Implement type ramp: display (30px/700), h1 (24px/700), h2 (20px/600), h3 (16px/600), body (14px/400), body-sm (13px), caption (12px/500), mono (13px). Update tailwind.config.js fontFamily and fontSize.

**UX-DR4 — Lucide Icon Migration:** Replace ALL @heroicons/react imports with lucide-react equivalents. Remove all emoji used as icons (⚡📖✅🎯📋📄😿). Implement icon size scale: 18px default, 16px inline, 22-24px stat cards, 14px badges, 36-48px empty states.

**UX-DR5 — Component: Sidebar:** 260px expanded / 64px collapsed. Active item: accent bg + on-accent text. Footer: settings, sync button, language toggle, theme toggle. Collapse toggle at bottom. Section divider between nav and footer.

**UX-DR6 — Component: Card:** Universal container with elevated fill, border-default 1px, rounded.lg (14px), default shadow. Hover: shadow lift + translateY(-1px).

**UX-DR7 — Component: Button Primary:** Accent fill, on-accent text, rounded.md (10px). Hover: accent-hover. Active: scale(0.98) with 80ms ease-out.

**UX-DR8 — Component: Button Secondary:** Sunken fill, primary text, border-default 1px. Same transitions as primary.

**UX-DR9 — Component: Input / Select:** Elevated bg (light) / sunken-dark bg (dark). Border-default 1px. Focus: 2px accent ring, 1px offset. Placeholder in foreground-tertiary.

**UX-DR10 — Component: Status Badge:** Pill shape (rounded.full), status palette bg/fg pairs per theme, caption font (12px/500).

**UX-DR11 — Component: Kanban Column:** Sunken fill, rounded.lg. Top 3px solid status-color strip. Header: caption uppercase.

**UX-DR12 — Component: Kanban Card:** Rounded.md, draggable. Drag: opacity 0.5, scale 0.95. Drop zone: dashed 2px accent border + accent-subtle fill flash (200ms).

**UX-DR13 — Component: Code Block:** Rounded.lg, code-block-bg background. Shiki syntax highlighting with Catppuccin Mocha (dark) / Latte (light). Inline code: code-inline-bg fill, code-inline-fg text, rounded.sm.

**UX-DR14 — Component: Mermaid Diagram:** Client-side SVG rendering. Theme-aware: foreground-primary for text, accent for highlights, border-default for edges. Light bg: surface-elevated. Dark bg: surface-elevated-dark. Language badge top-left. Error fallback: raw code + destructive banner.

**UX-DR15 — Component: Stat Card:** 4-card grid. Icon badge (colored circle 48x48), caption label, h1 value, optional caption subtitle. Click navigates. Hover: shadow lift.

**UX-DR16 — Component: Epic Card:** 3-column grid. Key badge (accent-light bg), title h3, description line-clamp-2 body-sm, status badge, priority badge, progress bar (accent fill), labels row. Hover: shadow lift, title shifts to accent.

**UX-DR17 — Component: Priority Badge:** Rounded.md shape. Filled circle icon (8px) + label. Color from priority-* tokens per theme.

**UX-DR18 — Component: Create Modal:** Rounded.xl (20px). Overlay + blur(4px). Header with title + close. Dynamic form fields. Footer: cancel (secondary) left, submit (primary) right. Escape closes. Focus trap.

**UX-DR19 — Component: Markdown Renderer:** Prose styling with body base. Inline code and code blocks per UX-DR13/14. Tables: border-default borders. Headings: typography ramp. Links: accent + underline on hover. Mermaid per UX-DR14.

**UX-DR20 — Component: Story Detail Tabs:** Underline tab bar. Active: accent bottom border (2px) + accent foreground. Inactive: foreground-tertiary + transparent border.

**UX-DR21 — Component: Theme Toggle:** Icon button in sidebar footer. Sun/moon icon. Reads prefers-color-scheme initially. Persists to localStorage('bmad-theme'). Toggles dark class on <html>.

**UX-DR22 — Toast System:** Bottom-right, auto-dismiss 4s (success) / 8s (error). Rounded.md, surface-elevated bg. Replaces all alert() calls.

**UX-DR23 — Win11-Snappy Transitions:** Hover/active: 80–150ms ease-out. Modal enter/exit: 200ms cubic-bezier(0.16, 1, 0.3, 1). Sidebar collapse: 200ms ease-out. No bouncy animations.

**UX-DR24 — Accessibility (WCAG 2.1 AA):** Focus rings: 2px accent outline, 1px offset on all interactive elements. Tab order matches visual reading order. Escape closes modals. ARIA roles: nav, main, complementary. aria-live="polite" for status changes. lang attribute switches en/ru.

**UX-DR25 — i18n Retention:** Existing EN/RU system retained. All new microcopy must have both locales. Use @/lib/i18n dictionary keys.

**UX-DR26 — Desktop-Only Layout:** No responsive breakpoints. Single viewport target: 1024px+. max-w-7xl (1280px) main content. Sidebar fixed left.

### FR Coverage Map

| FR | Epic | Описание |
|---|---|---|
| FR-1 | Epic 1 | Electron shell — запуск как нативное приложение |
| FR-2 | Epic 1 | React UI reuse — миграция компонентов |
| FR-3 | Epic 1 | Window management — состояние окна |
| FR-4 | Epic 2 | SQLite config — хранение проектов |
| FR-5 | Epic 2 | Project switcher — переключение проектов |
| FR-6 | Epic 2 | Add/Remove projects — управление проектами |
| FR-7 | Epic 3 | Filesystem watcher — авто-синхронизация |
| FR-8 | Epic 3 | Manual sync — ручная синхронизация |
| FR-9 | Epic 4 | CRUD verification — редактирование контента |
| FR-10 | Epic 4 | Manual edit warning — предупреждение |
| FR-11 | Epic 5a, 5b-i, 5b-ii | Dark theme — токены (5a) + core компоненты (5b-i) + rich компоненты (5b-ii) |
| FR-12 | Epic 5a, 5b-i, 5b-ii | Win11 design — transitions/spacing (5a) + core (5b-i) + rich (5b-ii) |
| FR-13 | Epic 6 | Auto-update — автоматические обновления |
| D-1 | Epic 6 | MIT License — лицензия |
| D-2 | Epic 6 | Donation links — ссылки на донаты |

### NFR Coverage Map

| NFR | Адресуется в | Примечание |
|---|---|---|
| NFR-1 (Startup <5s) | Epic 1, Epic 5a | Code splitting, lazy loading, Shiki lazy init |
| NFR-2 (Watcher reliability) | Epic 3 | Graceful degradation, error boundaries |
| NFR-3 (Cross-platform) | Epic 1, Epic 6 | Build configs, platform-specific paths; NSIS vs squirrel решено в Epic 1 |
| NFR-4 (Security / user-scoped) | Epic 2, Epic 6 | SQLite paths, app data directories |

### Cross-Cutting Requirements (все эпики)

| Требование | Применение | Примечание |
|---|---|---|
| **Accessibility (WCAG 2.1 AA)** | Каждый эпик | Focus rings, ARIA, keyboard nav, contrast — AC для каждой истории |
| **i18n (EN/RU)** | Каждый эпик | Все новые строки — оба языка через @/lib/i18n |
| **Vitest тесты** | Каждый эпик | Unit-тесты на новый код; Epic 1 включает setup |
| **electron-log** | Каждый эпик | Логирование ключевых операций |

## Epic List

### Epic 1: Desktop Application Shell + Dashboard
Пользователь запускает приложение как нативное десктопное окно и видит работающий Dashboard с существующими компонентами.
**FRs covered:** FR-1, FR-2, FR-3
**UX-DRs covered:** UX-DR26 (desktop-only layout)
**Технические решения:** electron-vite starter, React Router v6, Zustand skeleton, IPC bridge skeleton, базовый Tailwind, Vitest setup, минимальный Dashboard (существующие компоненты с `jira-*` цветами), NSIS vs squirrel decision

### Epic 5a: Dark Theme & Polished Foundation *(второй по порядку)*
Пользователь видит приложение в тёмной теме с плавными переходами, современной типографикой и иконками — визуальная основа продукта готова.
**FRs covered:** FR-11 (частично — токены), FR-12 (частично — transitions, spacing)
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR21, UX-DR22, UX-DR23
**Технические решения:** CSS custom properties, Tailwind config, @fontsource, Lucide, toast system, Win11 transitions, theme toggle (базовый)

### Epic 2: Multi-Project Support
Пользователь настраивает несколько проектов, переключается между ними — настройки сохраняются в SQLite с JSON fallback.
**FRs covered:** FR-4, FR-5, FR-6
**UX-DRs covered:** UX-DR5 (Sidebar), UX-DR25 (i18n)
**Технические решения:** SQLite schema + JSON fallback (параллельно с самого начала), StoreManager per-project, project switcher UI
**NFR AC:** Memory usage < 300MB with 50+ stories loaded (SM-C1)

### Epic 3: Real-Time Filesystem Sync
Изменения markdown-файлов AI-агентами появляются в UI в течение ~30 секунд.
**FRs covered:** FR-7, FR-8
**UX-DRs covered:** UX-DR22 (toast для ошибок)
**Технические решения:** fs.watch + chokidar polling, IPC file:changed events, debounce/throttle, graceful error handling

### Epic 4: Content Reading, Status Updates & Safeguards
Пользователь читает распарсенные markdown-документы и обновляет статус эпиков/историй (создание и удаление — зона ответственности AI-агентов) — с предупреждением при ручном редактировании.
**FRs covered:** FR-9, FR-10
**UX-DRs covered:** UX-DR9 (Input), UX-DR18 (Create Modal), UX-DR19 (Markdown Renderer), UX-DR20 (Story Detail Tabs), UX-DR22 (toast), UX-DR25 (i18n)
**Технические решения:** File lock (30s timeout), CRUD operations, markdown validation, warning dialog, Create Modal, Markdown editor

### Epic 5b-i: Polished Navigation & Core UI
Пользователь взаимодействует с отполированной боковой панелью, карточками, кнопками, полями ввода, значками статуса и приоритета — базовый UI полностью готов.
**FRs covered:** FR-11 (core компоненты), FR-12 (core компоненты)
**UX-DRs covered:** UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR17, UX-DR18, UX-DR21, UX-DR22, UX-DR23, UX-DR24, UX-DR25, UX-DR26
**Технические решения:** Все core компоненты по DESIGN.md, WCAG 2.1 AA, i18n EN/RU

### Epic 5b-ii: Rich Components & Content Rendering
Пользователь видит специализированные компоненты: Kanban, Epic Card, Stat Card, Markdown Renderer с Shiki, Mermaid diagrams, Story Detail Tabs, Code Blocks.
**FRs covered:** FR-11 (rich компоненты), FR-12 (rich компоненты)
**UX-DRs covered:** UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR19, UX-DR20
**Технические решения:** Shiki + Catppuccin Mocha/Latte, Mermaid.js SVG rendering, Kanban drag-and-drop, Epic Card grid, Stat Card dashboard

### Epic 6: Distribution & Auto-Updates
Пользователь устанавливает приложение и получает автоматические обновления через GitHub Releases.
**FRs covered:** FR-13, D-1, D-2
**Технические решения:** electron-builder config, GitHub Releases, electron-updater, MIT LICENSE, About dialog с donation links, README (clone → install → run → build)

## Зависимости между эпиками

```
Epic 1 (Shell + Dashboard)
    ↓
Epic 5a (Tokens & Infrastructure) — фундамент для всего UI
    ↓
Epic 2 (Multi-Project) ← использует токены и Lucide
    ↓
Epic 3 (Sync) ← использует toast
    ↓
Epic 4 (Editing) ← использует токены, Lucide, toast
    ↓
Epic 5b-i (Core Components) ← заменяет placeholder-компоненты
    ↓
Epic 5b-ii (Rich Components) ← Shiki, Mermaid, Kanban
    ↓
Epic 6 (Distribution)
```

## Epic 1: Desktop Application Shell + Dashboard

**Goal:** Пользователь запускает приложение как нативное десктопное окно и видит работающий Dashboard.

**FRs covered:** FR-1, FR-2, FR-3
**UX-DRs covered:** UX-DR26 (desktop-only layout)
**Cross-cutting:** Accessibility (WCAG 2.1 AA focus rings on all interactive elements), i18n (EN/RU labels), Vitest (setup + tests), electron-log (configured)

### Story 1.1: Initialize Electron-Vite Project

As a developer,
I want the Electron-Vite project initialized with the correct folder structure,
So that I have a working foundation for the desktop application.

**Acceptance Criteria:**

**Given** a fresh repository  
**When** I run `npm create electron-vite@latest bmad-board -- --template react-ts`  
**Then** the project builds successfully with `npm run build`  
**And** `npm run dev` launches both main and renderer processes  
**And** the folder structure follows Architecture: `src/main/`, `src/preload/`, `src/renderer/`  
**And** TypeScript strict mode is enabled  
**And** Tailwind CSS is configured and working  
**And** `package.json` scripts include `dev`, `build`, `preview`, `test`

### Story 1.2: Setup React Router, Zustand, and IPC Skeleton

As a developer,
I want React Router v6 routes, Zustand stores, and typed IPC channels set up,
So that the application has navigation, state management, and main/renderer communication.

**Acceptance Criteria:**

**Given** the Electron-Vite project is initialized  
**When** I navigate to `/`, `/board`, `/backlog`, `/epics`, `/stories/:id`, `/docs`, `/diagnostics`  
**Then** each route renders a placeholder page component without errors  
**And** Zustand store skeleton exists with `activeProjectId`, `epics`, `stories` state slices  
**And** `electron-typed-ipc` channels are registered: `config:read`, `config:write`, `project:list`, `project:switch`  
**And** preload script exposes typed IPC bridge to renderer via `contextBridge`  
**And** all routes are accessible via sidebar navigation links  
**And** React Router `<Outlet />` replaces Next.js `layout.tsx` pattern

### Story 1.3: Migrate Existing React Components to Renderer

As a user,
I want all existing React components from the Next.js app to work in Electron,
So that the UI is functional from day one.

**Acceptance Criteria:**

**Given** the existing Next.js components in the codebase  
**When** they are moved to `src/renderer/components/`  
**Then** Sidebar, StatusBadge, CreateModal render without errors in Electron  
**And** Tailwind styles apply correctly (no visual regression beyond expected adaptations)  
**And** all `@/*` path aliases resolve correctly in Vite (`resolve.alias` in `vite.config.ts`)  
**And** `gray-matter` works in renderer process (Node.js API available in Electron)  
**And** existing i18n (EN/RU) system loads and functions via `@/lib/i18n`  
**And** `serverComponentsExternalPackages` config is removed (not needed in Electron)  
**And** `marked` markdown rendering works in renderer  
**And** `uuid` v4 ID generation works for new artifacts  
**And** visual regression baseline is established: `npm run test:visual` script captures screenshots of Dashboard, Board, Backlog, Epics, Stories, Docs, Diagnostics pages  
**And** screenshots are saved to `tests/visual-baselines/` for future comparison  
**And** baseline generation runs successfully without errors

### Story 1.4: Implement Native Window Management

As a user,
I want the application window to remember its size and position,
So that my desktop experience feels native and consistent.

**Acceptance Criteria:**

**Given** the application is running  
**When** I resize or move the window  
**Then** the window state (width, height, x, y) is saved to SQLite preferences table  
**And** on next launch, the window restores to the saved state  
**And** minimize, maximize, and close buttons work as expected  
**And** close behavior quits the application (not minimize to tray)  
**And** window has a minimum size of 1024x768  
**And** window title shows "BMAD Board"  
**And** `electron-log` is configured: file rotation 5MB, platform-appropriate log directory (`~/.config/bmad-board/logs/` on Linux, `%APPDATA%/bmad-board/logs` on Windows, `~/Library/Logs/bmad-board` on macOS)

### Story 1.5: Setup Vitest and Render Minimal Dashboard

As a user,
I want to see a working Dashboard when I open the app,
So that I have a useful starting point.

**Acceptance Criteria:**

**Given** the application launches  
**When** the Dashboard loads  
**Then** it displays a 4-card stat grid: **Epics** (total count), **Stories** (total count), **Active** (in-progress + in-review count), **Completed** (done count) — all showing "0" on first run  
**And** the sidebar shows navigation to all surfaces with focus rings (2px accent outline, 1px offset)  
**And** the app title bar shows "BMAD Board"  
**And** Vitest is configured with at least one passing test (Dashboard renders without errors)  
**And** test files use `.test.ts` / `.test.tsx` alongside source files  
**And** `npm run test` executes all tests successfully  
**And** Dashboard i18n labels exist in both EN and RU dictionaries  
**And** Dashboard layout is desktop-only (no responsive breakpoints, min-width 1024px)

---

## Epic 5a: Dark Theme & Polished Foundation

**Goal:** Пользователь видит приложение в тёмной теме с плавными переходами, современной типографикой (Inter + JetBrains Mono), иконками Lucide и toast-уведомлениями — визуальная основа продукта готова.

**FRs covered:** FR-11 (частично — токены), FR-12 (частично — transitions, spacing)
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR21, UX-DR22, UX-DR23
**Cross-cutting:** Accessibility (WCAG 2.1 AA contrast for all token pairs), i18n (toast messages), Vitest (token tests)

### Story 5a.1: Implement CSS Custom Properties and Tailwind Config

As a developer,
I want all design tokens as CSS custom properties mapped in Tailwind,
So that components can use theme-aware colors, surfaces, and borders.

**Acceptance Criteria:**

**Given** the application is running  
**When** I inspect any component  
**Then** colors come from CSS variables (e.g., `bg-[var(--color-surface-elevated)]`)  
**And** `design-tokens.css` defines all 50+ light/dark pairs for: surface hierarchy, foreground levels, accent (teal), borders, status palette, priority palette, code blocks, destructive  
**And** `tailwind.config.js` maps custom properties to utilities: `surface`, `foreground`, `accent`, `border`, `status`, `priority`, `code`  
**And** `darkMode: 'class'` strategy is enabled; toggling `dark` class on `<html>` switches all tokens  
**And** all existing `jira-*` Tailwind custom colors are removed  
**And** no `dark:` prefix duplication remains in component classes  
**And** contrast ratios for all foreground/bg pairs meet WCAG 2.1 AA (4.5:1 minimum)

### Story 5a.2: Setup Typography and Lucide Icons

As a user,
I want Inter and JetBrains Mono fonts with Lucide icons throughout the app,
So that the UI looks modern and consistent, with no emoji or Heroicons.

**Acceptance Criteria:**

**Given** the application renders  
**When** I view any page  
**Then** all text uses Inter (UI) or JetBrains Mono (code) via `@fontsource/inter` and `@fontsource/jetbrains-mono`  
**And** Tailwind type ramp is configured: display (30px/700), h1 (24px/700), h2 (20px/600), h3 (16px/600), body (14px/400), body-sm (13px), caption (12px/500), mono (13px)  
**And** all `@heroicons/react` imports are replaced with `lucide-react` equivalents  
**And** zero emoji-as-icons remain in the product (no ⚡📖✅🎯📋📄😿)  
**And** icon sizes follow the scale: 18px default, 16px inline, 22–24px stat cards, 14px badges, 36–48px empty states  
**And** `@heroicons/react` dependency is removed from `package.json`

### Story 5a.3: Implement Toast System and Win11-Snappy Transitions

As a user,
I want toast notifications and snappy transitions,
So that I get feedback on actions and the UI feels responsive.

**Acceptance Criteria:**

**Given** any action triggers a notification  
**When** a success or error occurs  
**Then** a toast appears bottom-right with `surface-elevated` bg and `rounded.md` corners  
**And** success toasts auto-dismiss after 4s; error toasts after 8s  
**And** toast text is i18n-ready (EN/RU)  
**And** all existing `alert()` calls are replaced with toast notifications  
**And** hover/active transitions are 80–150ms `ease-out`  
**And** modal enter/exit is 200ms `cubic-bezier(0.16, 1, 0.3, 1)`  
**And** sidebar collapse is 200ms `ease-out`  
**And** no bouncy/spring animations are used anywhere  
**And** transition utilities are defined in CSS/Tailwind for reuse

### Story 5a.4: Implement Theme Toggle

As a user,
I want to toggle between light and dark themes,
So that I can choose my preferred appearance.

**Acceptance Criteria:**

**Given** the application launches  
**When** the OS theme is determined  
**Then** `prefers-color-scheme` sets the initial theme (dark default)  
**And** a theme toggle button (sun/moon Lucide icon) is visible in sidebar footer  
**And** clicking the toggle switches `dark` class on `<html>`  
**And** the preference is persisted to `localStorage('bmad-theme')`  
**And** on next launch, the saved theme is applied before first paint (no flash)  
**And** all components update instantly when theme switches (no page reload)  
**And** toggle has 2px accent focus ring, 1px offset (accessibility)

---

<!-- Continue with Epic 2 -->

## Epic 2: Multi-Project Support

**Goal:** Пользователь настраивает несколько проектов, переключается между ними — настройки сохраняются в SQLite с JSON fallback.

**FRs covered:** FR-4, FR-5, FR-6
**UX-DRs covered:** UX-DR5 (Sidebar), UX-DR25 (i18n)
**Cross-cutting:** Accessibility (focus rings, ARIA labels), i18n (all UI labels), Vitest (StoreManager tests), electron-log (project operations logged)
**NFR AC:** Memory usage < 300MB with 50+ stories loaded (SM-C1)

### Story 2.0: Build Welcome / Onboarding Screen

As a new user,
I want guidance on how to start using BMAD Board,
So that I know what to do when I have no markdown files yet.

**Acceptance Criteria:**

**Given** the app launches with 0 configured projects or 0 valid BMAD artifacts  
**When** the Welcome screen appears  
**Then** it shows: "Welcome to BMAD Board" / "Добро пожаловать в BMAD Board"  
**And** it displays 3 steps: (1) Run BMAD AI agents to generate markdown artifacts, (2) Click "Add Project" and select the artifacts folder, (3) View your project board  
**And** each step has a Lucide icon and brief description  
**And** a prominent "Add Project" button is visible  
**And** the screen is accessible with Tab navigation and focus rings  
**And** i18n labels exist for both EN and RU  
**And** Welcome screen disappears once at least one project with valid artifacts is loaded  
**And** user can return to Welcome screen via sidebar "Help" or "?" icon  

### Story 2.1: Implement SQLite + JSON Fallback Storage

As a developer,
I want project configurations stored in SQLite with JSON fallback,
So that the app works even if native SQLite fails to build.

**Acceptance Criteria:**

**Given** the application launches for the first time  
**When** the storage layer initializes  
**Then** SQLite database is created automatically in platform-appropriate user app data directory  
**And** schema includes `projects` table (id, name, epics_dir, stories_dir, last_used_at, created_at)  
**And** schema includes `preferences` table (key, value) for window state and theme  
**And** if SQLite native module build fails, JSON file storage activates automatically as fallback  
**And** JSON fallback uses atomic writes (write to temp → rename)  
**And** both storage paths implement identical interface: `read()`, `write()`, `list()`, `delete()`  
**And** electron-log records which storage mode is active on startup  
**And** database migration table tracks schema version

### Story 2.2: Implement StoreManager with Per-Project Isolation

As a user,
I want each project isolated in memory,
So that switching projects doesn't mix data.

**Acceptance Criteria:**

**Given** multiple projects are configured  
**When** StoreManager switches project  
**Then** previous project's Store calls `unload()` (clears all Maps, nullifies references)  
**And** new project's Store calls `load()` (parses markdown from project dirs)  
**And** `globalThis.__storeManager` persists across hot-reloads  
**And** no references to old `globalThis.__store` singleton remain in codebase  
**And** StoreManager maintains `Map<string, Store>` with lazy load for inactive projects  
**And** memory usage stays under 300MB with 50+ stories loaded  
**And** `unload()` prevents memory leaks by clearing epics Map, stories Map, tasks Map, and unsubscribing watchers

### Story 2.3: Build Project Switcher UI

As a user,
I want to see and switch between my projects from the sidebar,
So that I can work on multiple BMAD projects quickly.

**Acceptance Criteria:**

**Given** two or more projects are configured  
**When** I open the project switcher in the sidebar  
**Then** I see a list of all projects with names and last-used timestamps  
**And** clicking a project switches the active store and reloads the UI  
**And** the last-used project is automatically loaded on application launch  
**And** switching projects completes in under 2 seconds (SM-4)  
**And** project switcher has keyboard navigation (Tab, Enter, Escape)  
**And** rapid clicks are debounced to prevent concurrent switches  
**And** i18n labels: "Projects" / "Проекты", "Switch project" / "Сменить проект"  
**And** ARIA: `role="listbox"`, `aria-label="Project switcher"`

### Story 2.4: Implement Add / Remove Project Flow

As a user,
I want to add new projects and remove old ones,
So that my project list stays up to date.

**Acceptance Criteria:**

**Given** I click "Add project"  
**When** the add project dialog opens  
**Then** I can select epics directory and stories directory via file picker  
**And** the app validates that selected directories exist  
**And** the app scans directories and warns if 0 valid BMAD artifacts found  
**And** on confirm, the project is saved to SQLite/JSON and appears in switcher  
**And** duplicate directory paths are detected and user is warned  
**And** removing a project removes it from SQLite only — markdown files are untouched  
**And** remove action shows confirmation dialog with destructive styling  
**And** all labels are i18n-ready (EN/RU)  
**And** focus trap is active in add/remove modals  
**And** Escape closes modals, Enter confirms

---

<!-- Continue with Epic 3 -->

## Epic 3: Real-Time Filesystem Sync

**Goal:** Изменения markdown-файлов AI-агентами появляются в UI в течение ~30 секунд.

**FRs covered:** FR-7, FR-8
**UX-DRs covered:** UX-DR22 (toast для ошибок)
**Cross-cutting:** Accessibility (toast ARIA live regions), i18n (sync status messages), Vitest (watcher tests), electron-log (watch events)

### Story 3.1: Implement Filesystem Watcher in Main Process

As a user,
I want the app to detect file changes automatically,
So that I see updates without manual action.

**Acceptance Criteria:**

**Given** a project is active  
**When** a markdown file is created, modified, or deleted in the artifact directories  
**Then** `fs.watch` in main process detects the change  
**And** changes are debounced (batch multiple changes within 30s window)  
**And** IPC event `file:changed` is sent to renderer with `{ path, type }`  
**And** if `fs.watch` is unreliable (macOS FSEvents, network drive), chokidar polling fallback activates at 30s interval  
**And** watcher is scoped to active project's artifact directories only  
**And** if watched directory is deleted, watcher stops gracefully with toast notification  
**And** if file is locked, retry once after 5s; if still locked, show non-blocking error toast  
**And** duplicate events are deduplicated by file path + mtime hash  
**And** 100 files changed simultaneously (e.g., git checkout) trigger single batch re-parse

### Story 3.2: Implement Sync Engine and Manual Sync Button

As a user,
I want a sync button for explicit re-sync and automatic UI updates,
So that I'm always looking at current data.

**Acceptance Criteria:**

**Given** the renderer receives `file:changed` event  
**When** the sync engine processes it  
**Then** the affected file is re-parsed with `gray-matter`  
**And** the in-memory store is updated (epics/stories Maps)  
**And** the UI re-renders with new data within 30 seconds (SM-2: 95% cases)  
**And** a manual sync button in sidebar forces immediate re-read of all artifact files  
**And** sync button shows spinner during operation and is disabled until complete  
**And** sync success shows toast: "Sync complete" / "Синхронизация завершена"  
**And** sync failure shows toast: "Sync failed. Check file paths." / "Ошибка синхронизации. Проверьте пути." with link to settings  
**And** sync status is announced via `aria-live="polite"` region  
**And** after any write operation (Epic 4), a re-sync confirms the change is reflected in store

---

<!-- Continue with Epic 4 -->

## Epic 4: Content Reading, Status Updates & Safeguards

**Goal:** Пользователь читает распарсенные markdown-документы и обновляет статус эпиков/историй (создание и удаление — зона ответственности AI-агентов), с предупреждением при ручном редактировании.

**FRs covered:** FR-9 (Update/Read only — Create/Delete removed per product decision), FR-10
**UX-DRs covered:** UX-DR9 (Input), UX-DR19 (Markdown Renderer), UX-DR20 (Story Detail Tabs), UX-DR22 (toast), UX-DR25 (i18n)
**Cross-cutting:** Accessibility (focus trap, ARIA labels, keyboard nav), i18n (all labels), Vitest (read/update tests), electron-log (edit operations)

### Story 4.1: Implement File Lock, Status Update, and Read-Only Document View

As a user,
I want the app to read markdown files and allow status changes without conflicting with AI agents,
So that I can track progress while AI agents manage the documents.

**Acceptance Criteria:**

**Given** a markdown file exists on disk  
**When** the app loads the project  
**Then** all epics, stories, and documents are parsed from markdown and displayed in UI  
**And** the app is read-first: no create or delete operations are available anywhere in the UI  
**And** file lock mechanism prevents concurrent writes between UI and AI agent  
**And** lock owner is tracked (`'ui'` or `'agent'`)  
**And** UI acquires explicit lock before status update, releases immediately after write completes (not timeout-based)  
**And** if lock is held by agent and UI attempts write, toast shows: "File is being edited by AI agent. Please wait." / "Файл редактируется AI-агентом. Пожалуйста, подождите."  
**And** stale locks (owner crashed) auto-release after 30s timeout as fallback  
**And** UI shows spinner/toast when file is locked  
**And** updating story status (drag-and-drop Kanban or select dropdown in backlog) writes to frontmatter and file remains valid markdown  
**And** before write, system checks file mtime; if file changed since last read, write is rejected with conflict toast: "File changed by another process. Refresh and try again." / "Файл изменён другим процессом. Обновите и попробуйте снова."  
**And** write uses atomic pattern: temp file → rename (never overwrites directly)  
**And** document view renders markdown with preserved frontmatter structure  
**And** after any status update, re-sync confirms the change in store  
**And** invalid frontmatter triggers try/catch + rollback with error toast  
**And** create/delete buttons are NOT present in any UI surface (Dashboard, Backlog, Epics, Stories, Docs)

### Story 4.2: Implement Manual Edit Warning and Markdown Editor

As a user,
I want to be warned before manually editing files,
So that I remember AI agent editing is preferred.

**Acceptance Criteria:**

**Given** I click "Edit" on a document or story markdown tab  
**When** the edit action triggers  
**Then** a warning dialog appears with text: "You are about to edit a file manually. This is bad practice. Use this only in exceptional cases. AI Agent editing is preferred." / "Вы собираетесь редактировать файл вручную. Это плохая практика. Используйте это только в исключительных случаях. Редактирование AI-агентом предпочтительнее."  
**And** user must click "Confirm" to proceed  
**And** "Don't show again" checkbox is available (per session only, not persistent)  
**And** confirmed edit opens raw markdown textarea with JetBrains Mono font  
**And** save writes to existing file only, preserves frontmatter, triggers re-sync  
**And** save failure shows toast and retains textarea content for retry  
**And** warning dialog has focus trap and Escape dismisses (cancel)  
**And** there is NO "Create new document/story/epic" button anywhere in the app  
**And** there is NO "Delete" action anywhere in the app

---

<!-- Continue with Epic 5b-i -->

## Epic 5b-i: Polished Navigation & Core UI

**Goal:** Пользователь взаимодействует с отполированной боковой панелью, карточками, кнопками, полями ввода, значками статуса и приоритета — базовый UI полностью готов.

**FRs covered:** FR-11 (core компоненты), FR-12 (core компоненты)
**UX-DRs covered:** UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR17, UX-DR18, UX-DR21, UX-DR22, UX-DR23, UX-DR24, UX-DR25, UX-DR26
**Cross-cutting:** Accessibility (WCAG 2.1 AA on all components), i18n (all labels), Vitest (component tests), electron-log (not applicable)

### Story 5b-i.1: Build Sidebar, Card, and Button Components

As a user,
I want a consistent sidebar, cards, and buttons,
So that navigation and content surfaces look polished.

**Acceptance Criteria:**

**Given** any page in the app  
**When** I view the sidebar  
**Then** it is 260px expanded / 64px collapsed with smooth 200ms ease-out transition  
**And** active item has accent bg + on-accent text  
**And** inactive items have foreground-secondary text, hover shows accent-subtle fill  
**And** footer contains settings panel, sync button, language toggle, theme toggle  
**And** section divider separates nav items from footer controls  
**And** collapse toggle at bottom persists state to localStorage  
**And** Card component has elevated fill, border-default 1px, `rounded.lg` (14px), default shadow  
**And** Card hover lifts shadow + `translateY(-1px)`  
**And** Button Primary has accent fill, on-accent text, `rounded.md` (10px), hover accent-hover, active `scale(0.98)` 80ms  
**And** Button Secondary has sunken fill, primary text, border-default 1px, same transitions  
**And** disabled state: opacity 0.5, pointer-events none  
**And** all interactive elements have 2px accent focus ring, 1px offset

### Story 5b-i.2: Build Input, Status Badge, and Priority Badge

As a user,
I want consistent inputs and visual indicators for status and priority,
So that forms and lists are readable and scannable.

**Acceptance Criteria:**

**Given** a form or list view  
**When** I see an Input or Select  
**Then** it has elevated bg (light) / sunken-dark bg (dark), border-default 1px, `rounded.md`  
**And** focus state: 2px accent ring, 1px offset  
**And** placeholder text in foreground-tertiary  
**And** Select dropdown uses same styling with arrow icon  
**And** Textarea: same borders, resizable vertical  
**And** Status Badge is `rounded.full` pill, background/foreground from status palette per theme, caption font (12px/500)  
**And** Priority Badge is `rounded.md` shape, filled circle icon (8px) + label, color from priority-* tokens per theme  
**And** all badge labels are i18n-translated (EN/RU)  
**And** focus rings visible on all inputs and badges

### Story 5b-i.3: Build Toast and Theme Toggle Polish

As a user,
I want toast notifications and a theme toggle,
So that I get feedback on actions and can choose my preferred appearance.

**Acceptance Criteria:**

**Given** any action triggers a notification  
**When** toast appears  
**Then** it is positioned bottom-right, `rounded.md`, `surface-elevated` bg  
**And** success auto-dismiss 4s, error 8s  
**And** Toast has close button (Lucide X) and progress bar for auto-dismiss  
**And** Theme Toggle in sidebar footer: sun/moon Lucide icon, toggles `dark` class, persists to localStorage  
**And** initial theme reads `prefers-color-scheme` before first paint (no flash)  
**And** all transitions: hover/active 80–150ms ease-out, modal 200ms cubic-bezier(0.16, 1, 0.3, 1)  
**And** ARIA: toast region has `role="status"`, `aria-live="polite"`

---

<!-- Continue with Epic 5b-ii -->

## Epic 5b-ii: Rich Components & Content Rendering

**Goal:** Пользователь видит специализированные компоненты: Kanban, Epic Card, Stat Card, Markdown Renderer с Shiki, Mermaid diagrams, Story Detail Tabs, Code Blocks.

**FRs covered:** FR-11 (rich компоненты), FR-12 (rich компоненты)
**UX-DRs covered:** UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR19, UX-DR20
**Cross-cutting:** Accessibility (drag-and-drop ARIA, keyboard alternatives), i18n (all labels), Vitest (renderer tests), electron-log (render errors)

### Story 5b-ii.1: Build Kanban Board with Status-Only Drag-and-Drop

As a user,
I want to drag story cards across status columns,
So that I can update story status visually without creating or deleting anything.

**Acceptance Criteria:**

**Given** the Sprint Board page  
**When** it loads  
**Then** 5 columns are visible: backlog, todo, in-progress, in-review, done  
**And** each column shows existing stories parsed from markdown files  
**And** there is NO "Create story" button or "Add card" action anywhere on the board  
**And** each column has sunken fill, `rounded.lg`, top 3px solid status-color strip  
**And** column header shows status label (caption, uppercase) and count badge  
**And** Kanban Card has `rounded.md`, draggable via HTML5 drag-and-drop  
**And** drag ghost: card preview at reduced opacity  
**And** drag state: opacity 0.5, scale 0.95, cursor grabbing  
**And** drop zone: dashed 2px accent border + accent-subtle fill flash (200ms)  
**And** optimistic UI: card moves immediately, status update fires in background  
**And** drop updates story status in markdown frontmatter only (no create/delete)  
**And** failure: toast "Couldn't save. Trying again." + retry icon pulses 30s  
**And** ARIA: columns have `role="list"`, `aria-label` for status; cards `role="listitem"`, `aria-grabbed`  
**And** keyboard alternative: select dropdown for status change (drag is mouse-only)

### Story 5b-ii.2: Build Epic Card, Stat Card, and Story Detail Tabs

As a user,
I want to see epic summaries and story details in polished cards and tabs,
So that I can scan progress and read content easily.

**Acceptance Criteria:**

**Given** the Epics page  
**When** it loads  
**Then** Epic Cards are in 3-column grid  
**And** each card shows: key badge (accent-light bg, caption mono), title (h3), description (line-clamp-2, body-sm), status badge, priority badge, progress bar (accent fill), labels row  
**And** hover: shadow lift, title shifts to accent color  
**And** click navigates to epic detail  
**And** Stat Card (Dashboard) has 4-card grid: icon badge (colored circle 48x48), caption label, h1 value, optional caption subtitle  
**And** Stat Card click navigates to relevant surface  
**And** hover: shadow lift per stat-card.hover-shadow  
**And** Story Detail Tabs: horizontal underline style  
**And** active tab: accent bottom border (2px) + accent foreground  
**And** inactive: foreground-tertiary + transparent border  
**And** Info tab: description, acceptance criteria (checklist), task list with checkboxes, sidebar metadata  
**And** Markdown tab: rendered content / raw editor toggle  
**And** all labels i18n-ready (EN/RU)

### Story 5b-ii.3: Implement Shiki Syntax Highlighting and Mermaid Diagrams

As a user,
I want code blocks with syntax highlighting and Mermaid diagrams rendered as SVG,
So that markdown documents look professional.

**Acceptance Criteria:**

**Given** a markdown document with code or Mermaid  
**When** it renders  
**Then** Code Block has `rounded.lg`, `code-block-bg` background, full syntax highlighting  
**And** Shiki uses Catppuccin Mocha (dark) / Catppuccin Latte (light) themes  
**And** theme switch updates code blocks immediately (no reload)  
**And** Inline code: `code-inline-bg` fill, `code-inline-fg` text, `rounded.sm`, px-1.5 py-0.5  
**And** ` ```mermaid ` fenced blocks render as SVG via Mermaid.js client-side  
**And** Mermaid container shows skeleton placeholder (pulsing `surface-sunken` rectangle matching expected diagram size) while rendering  
**And** Mermaid SVG inherits theme: foreground-primary for text/labels, accent for highlights, border-default for edges  
**And** Light theme: white (`surface-elevated`) SVG bg; Dark theme: `surface-elevated-dark` (#181B23) SVG bg  
**And** Language badge "mermaid" top-left, caption style, foreground-tertiary, rounded.sm, surface-sunken bg  
**And** on Mermaid render failure: fallback to raw monospace code block + destructive error banner  
**And** Shiki highlighter is lazy-initialized on first code block encounter (performance)  
**And** Shiki falls back to `plaintext` highlighting for unknown languages (never shows raw unformatted code)

---

<!-- Continue with Epic 6 -->

## Epic 6: Distribution & Auto-Updates

**Goal:** Пользователь устанавливает приложение и получает автоматические обновления через GitHub Releases.

**FRs covered:** FR-13, D-1, D-2
**Cross-cutting:** Accessibility (About dialog focus management), i18n (About dialog), Vitest (not applicable), electron-log (update events)

### Story 6.1: Configure electron-builder and Cross-Platform Builds

As a developer,
I want the app packaged for Windows, macOS, and Linux,
So that users can install it on their platform.

**Acceptance Criteria:**

**Given** the application code is complete  
**When** I run `npm run build`  
**Then** electron-builder produces installers for Windows (NSIS), macOS (DMG), and Linux (AppImage/DEB)  
**And** `electron-builder.yml` config includes app ID, icon paths, and platform-specific settings  
**And** NSIS is selected for Windows installer (decision documented)  
**And** build artifacts are output to `release/` directory  
**And** `npm run build` completes without errors on a clean machine  
**And** MIT LICENSE file exists in repository root  
**And** README contains instructions: clone → install → run → build

### Story 6.2: Implement Auto-Update via GitHub Releases

As a user,
I want the app to check for and install updates automatically,
So that I always have the latest version.

**Acceptance Criteria:**

**Given** the app launches  
**When** it checks for updates  
**Then** `electron-updater` queries GitHub Releases for latest version  
**And** if update is available, a notification toast appears with "Update available" / "Доступно обновление"  
**And** user can click to download and install  
**And** update installs without manual file replacement  
**And** update mechanism works on Windows, macOS, and Linux  
**And** if update check fails (network), retry on next launch with silent fail  
**And** if download is interrupted, resume on next launch  
**And** if install requires restart, user is prompted to defer until convenient  
**And** GitHub Releases rate limiting is handled with cache + backoff  
**And** electron-log records update check, download, and install events

### Story 6.3: Build About Dialog with Donation Links

As a user,
I want to see app info and support the project,
So that I know the version and can donate if I want.

**Acceptance Criteria:**

**Given** I open the About dialog from sidebar/footer  
**When** it renders  
**Then** it shows app name "BMAD Board", version, MIT license notice  
**And** it includes GitHub Sponsors link  
**And** it includes Buy Me a Coffee link  
**And** links open in default browser via `electron.shell.openExternal`  
**And** dialog has `rounded.xl`, overlay + blur, close button  
**And** Escape closes, focus trap active  
**And** all text is i18n-ready (EN/RU)  
**And** ARIA: `role="dialog"`, `aria-modal="true"`
