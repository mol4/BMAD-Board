# Deferred Work

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

## Deferred from: code review of story 1-5 (2026-05-30)

- Global `:focus-visible` rule in `src/renderer/index.css` does not account for forced-colors / high-contrast mode — approach (global rule, hardcoded jira-blue `#0052cc`) is spec-mandated; revisit during token/teal-accent migration in Epic 5a