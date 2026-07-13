# Deferred Work

## Deferred from: code review of story 5a-2 (2026-05-30)

- BoardPage.tsx story cards have no `<Link>` to StoryDetailPage — pre-existing, route `/stories/:id` exists and StoryDetailPage works; navigate-from-board is not scoped to any completed story; fix in Epic 2 or Epic 3

## Deferred from: code review of story 5a-1 (2026-05-30)

- Tailwind `content` glob `./src/renderer/**/*` does not cover root-level `src/components/` — pre-existing, likely dead code from Next.js migration; verify and clean up
- `--color-accent-light` token name semantically inverts in dark mode (resolves to `#134e4a`, a very dark value) — naming could confuse future consumers; consider renaming in Epic 5b
- `--color-status-ready-bg` (light `#ccfbf1`) duplicates `--color-accent-light` value — two separate tokens will drift independently when either is updated; consider a shared base token

## Deferred from: code review of story 1-1 (2026-05-28)

- `@heroicons/react` removed from deps but still imported in preserved `src/components/` — story 1-3 will replace with Lucide
- `src/components/` and `src/lib/` not included in any tsconfig — story 1-3 will restructure paths
- `'use client'` directives in preserved components — story 1-3 will remove during migration
- `fetch('/api/...')` calls have no handlers in Electron — story 1-2 will add IPC channels
- `@/lib/...` resolves to non-existent `src/renderer/lib/` — story 1-3 will update import paths
- `fs`/`path` modules unreachable from renderer — story 1-3 will migrate to IPC
- `js-yaml` is transitive dep via electron-builder — story 1-3 will add as direct dep or remove
- No error handling on `app.whenReady().then(createWindow)` — consider adding `.catch()` for robust error handling in production
- `document.getElementById('root')!` non-null assertion in main.tsx — consider defensive null check
- Empty `electronAPI` on `window` without TypeScript declaration — story 1-2 will add typed IPC bridge
- No `app.requestSingleInstanceLock()` — consider adding for single-instance enforcement
- `globals.css` deleted (Next.js) — story 1-3 will create new renderer stylesheet

## Deferred from: code review of story 1-2 (2026-05-28)

- `config:read` returns hardcoded stub — persistence comes in a later story
- `project:switch` accepts any string without validation — stub by design
- `project:remove` accepts any projectId without existence check — stub by design
- `setEpics`/`setStories` replace arrays wholesale — merge/dedup comes later
- `AppConfig.lastProjectId` is dead field — "remember last project" for future story
- Store singleton via `globalThis.__store` — explicitly deferred to story 2-2

## Deferred from: code review of story 1-3 (2026-05-29)

- Emoji icons in StatusBadge (`🔴🟠🟡🔵⚡📖✅🐛`) — pre-existing pattern; Lucide replacement comes in Epic 5a
- `initializeStore()` called in every page component — guard protects against re-init; architectural cleanup for later
- `markdown-parser.ts` is a stub — `syncMarkdownToStore()` always returns 0; spec acknowledges this; real file sync comes in Epic 3
- Missing i18n keys not verified — pre-existing issue, not caused by this change
- `marked` library not imported in any migrated page component — markdown rendering not yet wired into UI

## Deferred from: code review of story 1-3 round 2 (2026-05-29)

- `loadConfigFromIPC` is never called — config always uses defaults; IPC loading path is dead code. Wire in during Epic 3 when sync engine is implemented
- DocsPage `file://` fetch is non-functional — acknowledged as future IPC enhancement; page silently shows empty docs
- `initializeStore()` called on every page mount — guard prevents re-init but wasteful; architectural cleanup for later
- Path traversal risk in `file:read`/`file:readDirectory` IPC — no validation that paths are within project directory; security hardening deferred to Epic 3/4
- `marked` not used in renderer components — AC#7 says it should work; it imports fine but is never invoked in UI

## Deferred from: code review of story 1-4 (2026-05-30)

- Path traversal in `file:read`/`file:readDirectory` IPC — no validation that paths are within project directory; pre-existing issue, security hardening deferred to Epic 3/4
- No `maxFiles` limit on log rotation — rotated log files accumulate indefinitely; set `log.transports.file.maxFiles` when log volume becomes a concern
- No unit tests for `db.ts` (`getPref`, `setPref`, `getDb`) — entire persistence layer is untested; add in a future story or dedicated test pass
- No round-trip test for `isMaximized: true` with preserved `x`/`y` — minor test coverage gap in `window-state.test.ts`
- `PRAGMA foreign_keys = ON` not set in `db.ts` — FK enforcement off by default in SQLite; enable when first FK constraint is added to the schema
- Global `setupFiles` still applies jest-dom matchers to node tests — vitest 2.1.x does not support inline workspace projects; safe in practice (matchers only fail when called, not when registered); fix requires creating `vitest.workspace.ts`

## Deferred from: code review of story 1-3 round 3 (2026-05-29)

- `file:read`/`file:readDirectory` return `exists: false` for `EACCES` (permission denied treated same as not found) — pre-existing design choice, harden in Epic 3/4
- `recalculateEpicStatus` returns `in-progress` when all stories are `cancelled`/`skipped` — those statuses not yet in type union; revisit when status model is finalized
- Test double mock-clear (`beforeEach` + `afterEach` both call `vi.clearAllMocks()`) — redundant but harmless; clean up in a future test pass

## Deferred from: code review of 2-0-build-welcome-onboarding-screen (2026-06-04)

- Save error handling provides no user feedback — not required by AC; toast/error feedback for Story 2.4
- Config form not wrapped in `<form>` element — standard UX expectation but not in AC; polish for Epic 5b-i

## Deferred from: code review of story 1-5 (2026-05-30)

- Global `:focus-visible` rule in `src/renderer/index.css` does not account for forced-colors / high-contrast mode — approach (global rule, hardcoded jira-blue `#0052cc`) is spec-mandated; revisit during token/teal-accent migration in Epic 5a

## Deferred from: code review of 2-1-implement-sqlite-json-fallback-storage (2026-06-05)

- Removed IPC logging in config:write/project:* handlers — style preference, not required by AC
- Corrupt JSON silently resets with no backup — enhancement; spec says return defaults on read failure
- `isValidState` passes NaN coordinates in window-state.ts — pre-existing, not caused by this story
- `addProject` missing storiesMode validation in storage layer — defense-in-depth; IPC validates already
- `@types/better-sqlite3` 5 major versions behind runtime — pre-existing type definition mismatch
- JsonFallbackStorage init could theoretically loop on failure — low risk, theoretical edge case

## Deferred from: code review of 2-2-implement-storemanager-with-per-project-isolation (2026-06-09)

- React Strict Mode вызывает двойной debounce в Providers.tsx — dev-only, debounce обрабатывает второй вызов; pre-existing

## Deferred from: code review of 2-3-build-project-switcher-ui (2026-06-09)

- `storeManager._doSwitch` can leave the Zustand store permanently empty when a newer switch supersedes an in-flight one — pre-existing issue in StoreManager's `_doSwitch` method; the `clear()` followed by early return on generation mismatch leaves the store blank with no recovery path

## Deferred from: code review of 2-4-implement-add-remove-project-flow (2026-06-22)

- Нет валидации уникальности имени проекта — pre-existing design choice, two projects can have same name with different dirs
- `project:add` IPC не имеет входной валидации — pre-existing, no input sanitization for empty name/paths
- SQLite не имеет миграции для legacy `stories_mode` column — pre-existing schema versioning gap, SCHEMA_VERSION=1 but no migration logic

## Deferred from: code review of 2-4-implement-add-remove-project-flow round 2 (2026-07-06)

- Duplicated modal animation logic (~80 lines) across AddProjectModal and RemoveProjectDialog — refactor opportunity, extract into shared hook/component
- `fetchProjects` TOCTOU race when `force=true` and pending request exists — low probability, pre-existing pattern
- `fetchProjects` can hang indefinitely if IPC call stalls — pre-existing, no timeout mechanism
- Spec file `2-4-implement-add-remove-project-flow.md` still references `storiesMode` in Task 1 — doc issue, not code

## Deferred from: code review of 3-1-implement-filesystem-watcher-in-main-process (2026-07-06)

- `fs.watch` callback discards native `eventType` — design choice, low priority
- `scheduleChange` drops type change when mtime matches — edge case, low priority
- Missing `console.log` from spec reference implementation — cosmetic
- Test file extension `.tsx` vs `.ts` — cosmetic, .tsx correct for JSX

## Deferred from: code review of 3-1-implement-filesystem-watcher-in-main-process round 2 (2026-07-06)

- Path Traversal — renderer can watch arbitrary filesystem directories — pre-existing architectural decision, Electron app without sandbox
- IPC handler leak — `disposeWatchers` only stops watcher, never removes handlers — pre-existing pattern, setupIPC called once
- `ipcCleanup` typed as fragile coupling — cosmetic, inline type

## Deferred from: code review of 4-3-sync-story-status-to-sprint-status-yaml (2026-07-08)

- `updateStatusLine` false-positive match inside YAML block scalars — unlikely given predictable YAML structure, but regex should ideally anchor to `^  {key}:` pattern
- `updateLastUpdated` silently no-ops when `last_updated` field absent — file structure is predictable per spec; would only matter if someone manually removes the field
- External modification of sprint-status.yaml causes silent sync failure — by design per AC5; YAML sync is non-blocking and failures are logged but don't block primary operation

## Deferred from: code review of 4-2-implement-manual-edit-warning-and-markdown-editor (2026-07-13)

- **Focus trap in EditWarningDialog not verifiable** — component implementation not included in diff; defer verification until EditWarningDialog.tsx is reviewed
- **AC9 (no Create/Delete buttons) regression guard** — pre-existing concern from Story 4.1, not caused by this change; verify separately

## Deferred from: code review of 5b-i-2-build-input-status-badge-and-priority-badge (2026-07-13)

- Global `:focus-visible` outline may not follow `border-radius` — pre-existing CSS design decision; outline radius depends on OS/browser
- Select options `.map()` recreates array every render — minor optimization; arrays are small (5 items max), low impact
- No test for `className` override resolution — low priority enhancement; text-body/text-xs conflict doesn't manifest in Vite build order

## Deferred from: code review of story 5b-i-3-build-toast-and-theme-toggle-polish (2026-07-13)

- Redundant theme initialization — inline script and ThemeProvider both read `localStorage` + `matchMedia`. Kept as-is per developer decision: redundant but consistent, no functional conflict
- ThemeToggle tests assert literal i18n strings (`'Light theme'`, `'Dark theme'`) instead of verifying through translation keys — tests will break if default locale changes; i18n keys confirmed present in `i18n.tsx`, low risk in current scope
- Progress bar CSS custom properties (`var(--color-accent)`, `var(--color-destructive)`) lack fallback colors — bar renders transparent if CSS vars undefined; theme system guarantees these vars are always defined
- ARIA `aria-live="polite"` attribute not explicitly tested in `Toast.test.tsx` — attribute is present in code (AC#4), manual verification sufficient

## Deferred from: code review of story 5b-ii-1 (2026-07-13)

- Drag styles (opacity-50, scale-95, cursor-grabbing) not verified after dragEnd in KanbanCard tests — test coverage gap, no user impact
- Card shadow uses `shadow-card` design token (dual-layered) instead of UX spec's single `0 1px 2px` — matches existing design system, intentional deviation

## Deferred from: code review of story 5b-ii-2 (2026-07-13)

- No responsive breakpoints on EpicsPage grid — `grid-cols-3` has no sm/md/lg variants; cramped on narrow viewports. Deferred: responsive layout not in AC scope.
- Progress bar shows 0% for small done ratios — `Math.round(1/201*100)` = 0%. Use `Math.max(1, ...)` when doneCount > 0. Deferred: edge case UX polish.
- Missing React.memo on card components — EpicCard/StatCard re-render on parent list changes regardless of prop changes. Deferred: performance optimization, not a bug.
- Hardcoded magic strings — Route paths, localStorage keys, tab identifiers are inline literals. Deferred: pre-existing pattern in codebase.
- StatCard.iconBg coupling through raw class strings — Every call site hardcodes Tailwind classes. Deferred: design preference for semantic variants would be a separate refactor.
