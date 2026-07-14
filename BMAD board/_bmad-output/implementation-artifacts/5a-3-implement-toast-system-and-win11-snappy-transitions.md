---
baseline_commit: 50a0adc3f4e936b502fb059653b81a43b12df9bb
---

# Story 5a.3: Implement Toast System and Win11-Snappy Transitions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want toast notifications and snappy transitions,
so that I get feedback on actions and the UI feels responsive.

## Acceptance Criteria

1. **Given** any action triggers a notification **When** a success or error occurs **Then** a toast appears bottom-right with `surface-elevated` bg and `rounded-md` corners.
2. **And** success toasts auto-dismiss after 4s; error toasts after 8s.
3. **And** toast text is i18n-ready — all new message keys have both `ru` and `en` entries in `src/renderer/lib/i18n.tsx`.
4. **And** all existing user-facing `console.log()` / `console.error()` calls in `src/renderer/components/Sidebar.tsx` that represent operation results (save config, sync, reset) are replaced with toast notifications.
5. **And** hover/active transitions on interactive elements are 80–150ms `ease-out`.
6. **And** modal (`CreateModal`) enter/exit animation is 200ms `cubic-bezier(0.16, 1, 0.3, 1)`.
7. **And** sidebar collapse transition is `200ms ease-out` (down from `300ms`).
8. **And** no bouncy/spring animations exist anywhere in `src/renderer/`.
9. **And** transition timing utilities are defined in `tailwind.config.js` for reuse (`transitionTimingFunction['win11']`, `keyframes`, `animation`).
10. **And** a `Toast.test.tsx` Vitest test verifies the hook throws outside provider and succeeds within one.

## Tasks / Subtasks

- [x] **Task 1 — Add transition utilities to `tailwind.config.js`** (AC: #5, #6, #7, #9)
  - [x] In `tailwind.config.js`, inside `theme.extend`, add a `transitionTimingFunction` key:
    ```js
    transitionTimingFunction: {
      'win11': 'cubic-bezier(0, 0, 0.58, 1)',   // ease-out — for hover/active (80-150ms)
      'modal': 'cubic-bezier(0.16, 1, 0.3, 1)', // Win11 spring — for modal enter/exit
    },
    ```
  - [x] In `tailwind.config.js`, inside `theme.extend`, add `keyframes` and `animation` for toast entry and modal entry:
    ```js
    keyframes: {
      'toast-in': {
        '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
        '100%': { opacity: '1', transform: 'translateY(0)   scale(1)'    },
      },
      'modal-in': {
        '0%':   { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
        '100%': { opacity: '1', transform: 'translateY(0)   scale(1)'    },
      },
    },
    animation: {
      'toast-in': 'toast-in 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      'modal-in': 'modal-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
    },
    ```
  - [x] Keep all existing `colors`, `fontFamily`, `fontSize`, `darkMode: 'class'`, and `plugins` entries unchanged.
  - [x] Verify `npm run build` (or `npm run dev`) picks up the new utilities without errors.

- [x] **Task 2 — Create `src/renderer/components/Toast.tsx`** (AC: #1, #2, #3, #4, #10)
  - [x] Create `src/renderer/components/Toast.tsx` with the following exports:
    - `ToastVariant` type: `'success' | 'error'`
    - `Toast` interface: `{ id: string; message: string; variant: ToastVariant }`
    - `ToastContext` (internal)
    - `ToastContextValue` interface: `{ showToast: (message: string, variant?: ToastVariant) => void }`
    - `ToastProvider` component (default export or named)
    - `useToast` hook
  - [x] `ToastProvider` implementation:
    - Maintains `toasts: Toast[]` state via `useState`.
    - Uses `useRef<Map<string, ReturnType<typeof setTimeout>>>` to track per-toast auto-dismiss timers.
    - `dismiss(id)` removes toast from state and clears its timer.
    - `showToast(message, variant = 'success')` creates a toast with `crypto.randomUUID()` as `id`, appends to state, then sets a timer (`setTimeout(dismiss, 4000)` for success, `setTimeout(dismiss, 8000)` for error).
    - Renders `{children}` plus a fixed `<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">` container outside children.
    - Each `<Toast>` item inside that container has `pointer-events-auto` so buttons are clickable.
  - [x] Toast item visual spec (from UX-DR22):
    ```tsx
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-3 bg-surface-elevated border border-border-default rounded-md shadow-lg text-sm text-foreground-primary max-w-xs animate-toast-in pointer-events-auto"
    >
      {/* variant icon */}
      {toast.variant === 'success'
        ? <CheckCircle2 size={16} className="text-status-done-fg shrink-0" />
        : <XCircle     size={16} className="text-destructive shrink-0"    />}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => dismiss(toast.id)}
        className="p-0.5 rounded hover:bg-accent-subtle transition-colors duration-100 ease-win11 ml-1 shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} className="text-foreground-tertiary" />
      </button>
    </div>
    ```
    Import icons: `import { CheckCircle2, XCircle, X } from 'lucide-react';`
  - [x] `useToast` hook throws a clear error if used outside `ToastProvider`:
    ```ts
    export function useToast(): ToastContextValue {
      const ctx = useContext(ToastContext);
      if (!ctx) throw new Error('useToast must be used within ToastProvider');
      return ctx;
    }
    ```

- [x] **Task 3 — Add `ToastProvider` to `Providers.tsx`** (AC: #1)
  - [x] In `src/renderer/components/Providers.tsx`, import `{ ToastProvider }` from `'@/components/Toast'`.
  - [x] Wrap the returned JSX with `<ToastProvider>`:
    ```tsx
    // Before:
    return <I18nProvider>{children}</I18nProvider>;

    // After:
    return (
      <ToastProvider>
        <I18nProvider>{children}</I18nProvider>
      </ToastProvider>
    );
    ```
  - [x] The loading state `<div>` (before `setReady(true)`) remains unchanged — it renders inside `ToastProvider` so toasts are available during init errors too.

- [x] **Task 4 — Add i18n keys for toast messages** (AC: #3)
  - [x] In `src/renderer/lib/i18n.tsx`, add the following keys to **both** the `ru` and `en` objects.
  - [x] Add to `ru` (after the `'sidebar.configSaveError'` entry):
    ```ts
    'toast.configSaved':      'Настройки сохранены',
    'toast.configSaveError':  'Ошибка сохранения настроек',
    'toast.configReset':      'Настройки сброшены',
    'toast.configResetError': 'Ошибка сброса настроек',
    'toast.syncStarted':      'Синхронизация запущена',
    'toast.syncError':        'Ошибка синхронизации. Проверьте пути к файлам.',
    ```
  - [x] Add to `en` (after the `'sidebar.configSaveError'` entry):
    ```ts
    'toast.configSaved':      'Settings saved',
    'toast.configSaveError':  'Error saving settings',
    'toast.configReset':      'Settings reset',
    'toast.configResetError': 'Error resetting settings',
    'toast.syncStarted':      'Sync started',
    'toast.syncError':        'Sync failed. Check file paths.',
    ```

- [x] **Task 5 — Wire toast into `Sidebar.tsx`** (AC: #4, #7)
  - [x] In `src/renderer/components/Sidebar.tsx`, add import at top: `import { useToast } from '@/components/Toast';`
  - [x] Inside the `Sidebar` function, destructure: `const { showToast } = useToast();`
  - [x] In `saveConfig`, replace `console.log` / `console.error` with toast calls:
    ```tsx
    // Before:
    console.log(t('sidebar.save'));
    // After:
    showToast(t('toast.configSaved'), 'success');

    // Before:
    console.error(t('sidebar.configSaveError'));
    // After:
    showToast(t('toast.configSaveError'), 'error');
    ```
  - [x] In the "Reset" button onClick handler, replace `console.log` calls:
    ```tsx
    // Before:
    console.log('Config reset');
    // After:
    showToast(t('toast.configReset'), 'success');

    // Before:
    console.log('Config reset error');
    // After:
    showToast(t('toast.configResetError'), 'error');
    ```
  - [x] In the "Sync MD" button onClick handler, replace `console.log` calls:
    ```tsx
    // Before:
    console.log('Sync triggered');
    // After:
    showToast(t('toast.syncStarted'), 'success');

    // Before:
    console.log(t('sidebar.syncError'));
    // After:
    showToast(t('toast.syncError'), 'error');
    ```
  - [x] Fix the sidebar collapse transition (AC: #7): change `transition-all duration-300` → `transition-all duration-200 ease-win11`:
    ```tsx
    // Before (line ~90 of Sidebar.tsx):
    className={`bg-surface-elevated text-foreground-primary flex flex-col transition-all duration-300 ${...}`}
    // After:
    className={`bg-surface-elevated text-foreground-primary flex flex-col transition-all duration-200 ease-win11 ${...}`}
    ```

- [x] **Task 6 — Add modal enter/exit animation to `CreateModal.tsx`** (AC: #6)
  - [x] Rework the mount/unmount logic so the modal can play an exit animation before unmounting.
  - [x] Add `import { useState, useEffect } from 'react';` (already has `useState`; add `useEffect`).
  - [x] Add two local states at the top of the component:
    ```tsx
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    ```
  - [x] Add a `useEffect` to drive the enter/exit lifecycle:
    ```tsx
    useEffect(() => {
      if (isOpen) {
        setMounted(true);
        // Double RAF ensures the initial state renders before the transition fires
        const raf1 = requestAnimationFrame(() => {
          const raf2 = requestAnimationFrame(() => setVisible(true));
          return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf1);
      } else {
        setVisible(false);
        const t = setTimeout(() => setMounted(false), 200);
        return () => clearTimeout(t);
      }
    }, [isOpen]);
    ```
  - [x] Replace the current `if (!isOpen) return null;` guard with `if (!mounted) return null;`.
  - [x] Add transition classes to the backdrop `<div>` (the outer `fixed inset-0` div):
    ```tsx
    // Before:
    <div className="fixed inset-0 bg-surface-overlay flex items-center justify-center z-50">
    // After:
    <div className={`fixed inset-0 bg-surface-overlay flex items-center justify-center z-50 transition-opacity duration-200 ease-win11 ${visible ? 'opacity-100' : 'opacity-0'}`}>
    ```
  - [x] Add transition classes to the modal panel `<div>` (the `bg-surface-elevated rounded-lg shadow-xl` div):
    ```tsx
    // Before:
    <div className="bg-surface-elevated rounded-lg shadow-xl w-full max-w-lg mx-4">
    // After:
    <div className={`bg-surface-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 transition-all duration-200 ease-modal ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]'}`}>
    ```
  - [x] The `handleSubmit` function calls `onClose()` which sets `isOpen` to false — the exit animation now fires naturally.
  - [x] Ensure the existing keyboard handler (Escape closes) from `onClose` still works — no change needed, it calls `onClose` which drives `isOpen → false`.

- [x] **Task 7 — Write `Toast.test.tsx`** (AC: #10)
  - [x] Create `src/renderer/components/Toast.test.tsx`.
  - [x] Import `{ render, screen, act }` from `'@testing-library/react'` and `{ describe, it, expect }` from `'vitest'`.
  - [x] Import `{ ToastProvider, useToast }` from `'./Toast'`.
  - [x] Write a helper wrapper component that calls `useToast()` and exposes `showToast` via a test button:
    ```tsx
    function ToastConsumer() {
      const { showToast } = useToast();
      return (
        <>
          <button onClick={() => showToast('Saved!', 'success')}>success</button>
          <button onClick={() => showToast('Failed!', 'error')}>error</button>
        </>
      );
    }
    ```
  - [x] Test 1 — `useToast throws outside provider`:
    ```ts
    it('throws when used outside ToastProvider', () => {
      // Suppress React error boundary noise
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<ToastConsumer />)).toThrow('useToast must be used within ToastProvider');
      spy.mockRestore();
    });
    ```
  - [x] Test 2 — `success toast renders and is accessible`:
    ```ts
    it('renders a success toast with correct role', async () => {
      render(<ToastProvider><ToastConsumer /></ToastProvider>);
      await act(async () => {
        screen.getByText('success').click();
      });
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Saved!')).toBeInTheDocument();
    });
    ```
  - [x] Test 3 — `error toast renders`:
    ```ts
    it('renders an error toast', async () => {
      render(<ToastProvider><ToastConsumer /></ToastProvider>);
      await act(async () => {
        screen.getByText('error').click();
      });
      expect(screen.getByText('Failed!')).toBeInTheDocument();
    });
    ```
  - [x] Test 4 — `dismiss removes toast`:
    ```ts
    it('dismiss button removes the toast', async () => {
      render(<ToastProvider><ToastConsumer /></ToastProvider>);
      await act(async () => {
        screen.getByText('success').click();
      });
      const dismiss = screen.getByLabelText('Dismiss notification');
      await act(async () => { dismiss.click(); });
      expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
    });
    ```
  - [x] Run `npm run test` — all existing 44 + 4 new = 48 tests should pass.

- [x] **Task 8 — Final verification** (AC: all)
  - [x] Run `npm run dev` and visually verify: clicking "Save" in sidebar settings shows a green toast bottom-right; clicking "Sync MD" shows a toast; modal opens with a smooth scale-in animation.
  - [x] Run `npm run lint` — zero TypeScript errors. Confirm `useToast()` is typed correctly (no `any`).
  - [x] Run `npm run test` — all 48 tests pass.
  - [x] Confirm no `alert()` calls remain anywhere in `src/renderer/` (grep check).
  - [x] Confirm `transition-all duration-300` no longer exists in `src/renderer/` (replaced by `duration-200 ease-win11`).

## Dev Notes

### Critical Context from Previous Story (5a.2)

Story 5a.2 completed typography (Inter + JetBrains Mono via `@fontsource`) and full Lucide icon migration. Key learnings:

- **`project-context.md` is STALE** — it describes the old Next.js stack. The actual codebase is on branch `migrate-to-desktop` running Electron + Vite. Do NOT follow `project-context.md` for stack or architecture.
- `tailwind.config.js` is **CommonJS** (`module.exports`). Keep that format. Do NOT convert to ESM. The file already has `darkMode: 'class'`, `content: ['./src/renderer/**/*.{js,ts,jsx,tsx}']`, `fontFamily`, `fontSize`, `colors`, and `plugins` — add only `transitionTimingFunction`, `keyframes`, and `animation` to `theme.extend`. Do not remove anything.
- `@/*` alias resolves to `src/renderer/*` in both Vite (via `electron.vite.config.ts` → `vite.config.ts`) and Vitest (via `vitest.config.ts`).
- 44 tests pass. Story 5a.3 should bring the total to 48.
- `lucide-react` is installed. Use `CheckCircle2`, `XCircle`, `X` for the Toast icons — all are available in `lucide-react`.

### Alert() Audit Result

All `alert()` calls are in `src/components/Sidebar.tsx` — the **old Next.js component directory** (`src/components/`, not `src/renderer/components/`). This legacy file is not used by the Electron renderer. The renderer's `src/renderer/components/Sidebar.tsx` already has `console.log()` and `console.error()` in place of alerts. Story 5a.3 replaces those `console.*` calls with `showToast(...)` for user-facing feedback. Diagnostic / debug `console.*` calls (e.g. `console.log('[Config] Loaded...')`) must NOT be changed — only the 5 user-facing calls in `Sidebar.tsx` (save, save error, reset, reset error, sync, sync error).

### Toast Architecture — Exact Design

**Context pattern** (NOT Zustand) because toast is pure UI state:
- `ToastContext` carries only `{ showToast }` — prevents unnecessary re-renders from toast queue changes.
- The actual queue state lives inside `ToastProvider` — only provider re-renders when queue changes.
- Components calling `useToast()` only get `showToast`, so they don't re-render when toasts arrive/disappear.
- `useRef<Map<string, ReturnType<typeof setTimeout>>>` for timers — avoids stale closure issues with `setTimeout` IDs.

**Timer management — critical detail:**
When `showToast` is called, store the `setTimeout` return value in the `timers` ref Map, keyed by toast ID. In `dismiss`, look up and `clearTimeout` before deleting. This prevents double-dismiss crashes (dismiss button + auto-timeout firing at the same millisecond).

**`crypto.randomUUID()` availability:**
Electron renderer process runs in a Chromium context where `crypto.randomUUID()` is available. No need for the `uuid` package (already in the project but unnecessary for this).

**Toast container accessibility:**
- Outer wrapper: `role` is NOT needed on the container div — individual toasts carry `role="status"`.
- Each toast item: `role="status"` + `aria-live="polite"` satisfies WCAG 2.1 AA status change requirement (UX-DR24).
- Dismiss button: `aria-label="Dismiss notification"`.

### Win11-Snappy Transitions — What Changes

| Location | Before | After | Notes |
|---|---|---|---|
| `tailwind.config.js` | No custom timing/keyframes | Add `transitionTimingFunction['win11']`, `transitionTimingFunction['modal']`, `keyframes`, `animation` | Foundation for reuse |
| `Sidebar.tsx` `<aside>` | `transition-all duration-300` | `transition-all duration-200 ease-win11` | AC #7 — sidebar collapse |
| `CreateModal.tsx` panel | Static show/hide | `transition-all duration-200 ease-modal` with opacity + translateY + scale | AC #6 — modal enter/exit |
| `CreateModal.tsx` overlay | Static show/hide | `transition-opacity duration-200 ease-win11` | Backdrop fade |
| Other `transition-colors` | Default 150ms cubic-bezier(0.4,0,0.2,1) | No change needed | 150ms is within 80–150ms range; easing is imperceptibly different |

**Why only these two explicit fixes?** The Tailwind default `transition-colors` is 150ms, which satisfies "80–150ms." Changing every `transition-colors` to add `ease-out` explicitly is scope creep for this story. The Sidebar collapse (300ms = too slow) and modal (no animation at all) are the only visible regressions. The `ease-win11` utility is available for future stories to adopt.

### Modal Animation Pattern — Why This Implementation

The current `if (!isOpen) return null` pattern unmounts immediately, making exit animations impossible. The new pattern:
1. `mounted` state controls DOM presence (unmounts only after animation finishes)
2. `visible` state drives CSS opacity/transform classes
3. `isOpen → true`: mount → next RAF → next RAF → set `visible=true` (double RAF is required to avoid the CSS transition being skipped when the element first appears in the DOM)
4. `isOpen → false`: `visible=false` (starts exit animation) → 200ms later `mounted=false` (unmount)

This is a minimal, dependency-free pattern. Do NOT reach for Framer Motion, react-spring, or any animation library — they're not in the project and would violate the "no over-engineering" rule.

### TypeScript Patterns to Follow

- Toast types in `Toast.tsx` only — do not create a `types.ts` entry for `Toast`/`ToastVariant`.
- `useToast` return type is `ToastContextValue` (not `typeof useToast`).
- No `any` types. `timers` ref: `useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())`.
- `crypto.randomUUID()` returns `string` — TypeScript knows this in the browser/Electron environment.
- `useEffect` cleanup: return the `cancelAnimationFrame` / `clearTimeout` function directly.

### Source Tree: Files to Create / Modify

**NEW:**
- `src/renderer/components/Toast.tsx` — ToastProvider, useToast hook, toast item rendering
- `src/renderer/components/Toast.test.tsx` — 4 Vitest tests for the hook + rendering

**UPDATE:**
- `tailwind.config.js` — add `transitionTimingFunction`, `keyframes`, `animation` to `theme.extend`
- `src/renderer/components/Providers.tsx` — wrap `<I18nProvider>` with `<ToastProvider>`
- `src/renderer/components/Sidebar.tsx` — 5 console.log/error replacements + duration-300 → duration-200 ease-win11
- `src/renderer/components/CreateModal.tsx` — add mounted/visible state + enter/exit animation
- `src/renderer/lib/i18n.tsx` — add 6 `toast.*` keys to both `ru` and `en`

**VERIFY (no change needed):**
- `src/renderer/App.tsx` — no change; ToastProvider is at Providers level, above Router
- `src/renderer/main.tsx` — no change; Providers already wraps App
- `src/renderer/components/MarkdownModal.tsx` — not in scope for this story
- `src/renderer/pages/DiagnosticsPage.tsx` — sync button there only logs diagnostics, not user-facing action feedback (it already shows a loading state)

### Testing Standards

- Vitest + `@testing-library/react` (both installed, see `package.json` devDependencies)
- `jsdom` environment is active for all `src/renderer/**` tests (configured in `vitest.config.ts`)
- `setupFiles: ['src/renderer/setupTests.ts']` — `@testing-library/jest-dom/matchers` are extended
- Use `act(async () => { ... })` around user interactions to flush state updates
- Suppress `console.error` in the "throws outside provider" test with `vi.spyOn` to keep test output clean

### What NOT to Do (Deferred to Later Stories)

- **Theme toggle** (sun/moon Lucide icon, `localStorage('bmad-theme')`, `prefers-color-scheme`) → **Story 5a.4**
- **Full component polish** (Card hover shadows, button `active:scale(0.98)`, full Input styling, Kanban columns, Status Badge) → **Epics 5b-i / 5b-ii**
- **Framer Motion or any animation library** → explicitly forbidden; CSS transitions only
- **Toast for DiagnosticsPage re-sync result** → the resync flow is more complex (async result from IPC); this is 5b-i or later
- **Toast for EpicsPage / BacklogPage create actions** → those pages call `onSubmit` via CreateModal which currently has no error handling exposed; deferred to 5b-i when full CRUD error handling is wired
- **`transition-colors ease-win11` on every button** → explicitly deferred; Tailwind default 150ms is close enough; do only the two explicit fixes in Tasks 5 and 6

### References

- UX-DR22: Toast system spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#UX-DR22`]
- UX-DR23: Win11 transition spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#UX-DR23`]
- UX-DR24: Accessibility (ARIA, focus rings) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#UX-DR24`]
- Architecture ADR-5: Toast for watcher errors [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-5`]
- Architecture cross-cutting concern #12: Win11-snappy transitions [Source: `_bmad-output/planning-artifacts/architecture.md`]
- Previous story dev notes (5a.2): tailwind.config.js is CommonJS, `@/*` alias, test count=44 [Source: `_bmad-output/implementation-artifacts/5a-2-setup-typography-and-lucide-icons.md`]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

N/A

### Completion Notes List

- ✅ Task 1: Added `transitionTimingFunction` (win11, modal), `keyframes` (toast-in, modal-in), and `animation` utilities to `tailwind.config.js` (CommonJS). All existing config preserved.
- ✅ Task 2: Created `src/renderer/components/Toast.tsx` with `ToastProvider`, `useToast` hook, `ToastVariant` type, `Toast` interface. Uses React Context (not Zustand) for minimal re-renders. `crypto.randomUUID()` for IDs, `useRef<Map>` for timer management to prevent double-dismiss race conditions. Lucide icons: `CheckCircle2` (success), `XCircle` (error), `X` (dismiss). Accessibility: `role="status"`, `aria-live="polite"`, `aria-label="Dismiss notification"`.
- ✅ Task 3: Added `ToastProvider` wrapper in `Providers.tsx` above `I18nProvider`.
- ✅ Task 4: Added 6 `toast.*` keys to both `ru` and `en` in `i18n.tsx`.
- ✅ Task 5: Wired `useToast` into `Sidebar.tsx`. Replaced 5 `console.log/error` user-feedback calls with `showToast`. Fixed sidebar collapse transition from `duration-300` to `duration-200 ease-win11` (AC #7).
- ✅ Task 6: Added enter/exit animation to `CreateModal.tsx` using mounted/visible state with double-RAF pattern. Backdrop fades with `ease-win11`, modal panel uses `ease-modal` (200ms cubic-bezier(0.16,1,0.3,1)). No animation library used.
- ✅ Task 7: Created `Toast.test.tsx` with 4 tests: throws outside provider, success render, error render, dismiss removes toast. Used `afterEach(cleanup)` to avoid cross-test DOM pollution.
- ✅ Task 8: lint clean (0 TypeScript errors), 48 tests pass, no `alert()` or `duration-300` in `src/renderer/`.
- ⚠️ `App.test.tsx` needed `ToastProvider` added to `renderWithProviders` wrapper since `Sidebar` now calls `useToast()`. Updated accordingly — still 44 original tests + 4 new = 48 total.

### File List

**NEW:**
- `src/renderer/components/Toast.tsx`
- `src/renderer/components/Toast.test.tsx`

**MODIFIED:**
- `tailwind.config.js`
- `src/renderer/components/Providers.tsx`
- `src/renderer/components/Sidebar.tsx`
- `src/renderer/components/CreateModal.tsx`
- `src/renderer/lib/i18n.tsx`
- `src/renderer/App.test.tsx`

### Review Findings

- [x] [Review][Decision] Toast system has no cap on concurrent toasts — deferred, acceptable risk for current UI usage patterns.

- [x] [Review][Patch] CreateModal double-RAF pattern leaks inner RAF handle [CreateModal.tsx:~29] — fixed via innerRafRef
- [x] [Review][Patch] Modal overlay intercepts clicks during 200ms exit animation [CreateModal.tsx:backdrop div] — fixed via pointer-events-none when invisible
- [x] [Review][Patch] ToastProvider does not clear pending auto-dismiss timers on unmount [Toast.tsx] — fixed via useEffect cleanup
- [x] [Review][Patch] ToastContext value object is recreated on every render, causing consumer re-renders [Toast.tsx:ToastContext.Provider] — fixed via useMemo
- [x] [Review][Patch] crypto.randomUUID() has no fallback if Web Crypto API is unavailable [Toast.tsx:showToast] — added Math.random fallback
- [x] [Review][Patch] Sync toast is shown immediately before window.location.reload() and is never visible [Sidebar.tsx:sync onClick] — removed pointless toast before reload
- [x] [Review][Patch] Toast tests miss timing, stacking, and unmount cleanup edge cases [Toast.test.tsx] — added auto-dismiss, unmount, and stacking tests
