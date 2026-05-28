# Deferred Work

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