---
baseline_commit: ac58297
---

# Story 5a.4: Implement Theme Toggle

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to toggle between light and dark themes,
so that I can choose my preferred appearance.

## Acceptance Criteria

1. **Given** the application launches **When** the OS theme is determined **Then** `prefers-color-scheme` sets the initial theme (dark default) and no flash of wrong theme occurs before first paint.
2. **And** a theme toggle button (sun/moon Lucide icon) is visible in the sidebar footer next to the language toggle.
3. **And** clicking the toggle switches the `dark` class on `<html>` instantly — all components update without page reload.
4. **And** the preference is persisted to `localStorage('bmad-theme')`.
5. **And** on next launch, the saved theme is applied before first paint (no flash) via an inline script in `index.html`.
6. **And** the toggle button has a 2px accent focus ring with 1px offset (accessibility, WCAG 2.1 AA).
7. **And** i18n labels exist for both EN and RU for any new UI text.
8. **And** a `ThemeToggle.test.tsx` Vitest test verifies the toggle renders, switches theme, and persists to localStorage.

## Tasks / Subtasks

- [x] **Task 1 — Add no-flash theme initialization script to `index.html`** (AC: #1, #5)
  - [x] Replace the hardcoded `class="dark"` on `<html>` with an inline `<script>` inside `<head>` that executes synchronously before any stylesheets load.
  - [x] Script logic (must be vanilla JS, no modules):
    ```html
    <script>
      (function() {
        const stored = localStorage.getItem('bmad-theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = stored ? stored === 'dark' : systemDark;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      })();
    </script>
    ```
  - [x] Place this script **before** the `<title>` tag or at least before `main.tsx` is loaded.
  - [x] Remove the hardcoded `class="dark"` from the `<html>` tag.

- [x] **Task 2 — Create `src/renderer/components/ThemeProvider.tsx`** (AC: #3, #4)
  - [x] Create a `ThemeContext` with value `{ isDark: boolean; toggleTheme: () => void }`.
  - [x] `ThemeProvider` reads `document.documentElement.classList.contains('dark')` for its initial `isDark` state (the inline script already set the class).
  - [x] `toggleTheme`:
    1. Reads current `document.documentElement.classList.contains('dark')`.
    2. Toggles the `dark` class on `<html>` via `classList.toggle('dark')`.
    3. Sets `localStorage.setItem('bmad-theme', newIsDark ? 'dark' : 'light')`.
    4. Updates React state `setIsDark(newIsDark)`.
  - [x] Export `useTheme()` hook that returns the context value; throw if used outside provider.
  - [x] No `useEffect` that re-applies class on mount — the inline script handles initial state; provider only needs to read it once for React state initialization.

- [x] **Task 3 — Add `ThemeProvider` to `Providers.tsx`** (AC: #3)
  - [x] Import `{ ThemeProvider }` from `'@/components/ThemeProvider'`.
  - [x] Wrap the returned JSX so the hierarchy becomes:
    ```tsx
    <ThemeProvider>
      <ToastProvider>
        <I18nProvider>{children}</I18nProvider>
      </ToastProvider>
    </ThemeProvider>
    ```
  - [x] Reason: `ThemeProvider` is at the very top so any component (including `ToastProvider` children) can call `useTheme()`.

- [x] **Task 4 — Add theme toggle button to `Sidebar.tsx`** (AC: #2, #3, #6)
  - [x] Add import: `import { Sun, Moon } from 'lucide-react';`.
  - [x] Add import: `import { useTheme } from '@/components/ThemeProvider';`.
  - [x] Inside `Sidebar` function, destructure: `const { isDark, toggleTheme } = useTheme();`.
  - [x] Add a new button in the footer area (after the language toggle `div`, inside the same border-t section):
    ```tsx
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors ${collapsed ? 'justify-center' : ''}`}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
      {!collapsed && <span>{isDark ? t('theme.light') : t('theme.dark')}</span>}
    </button>
    ```
  - [x] Ensure the button has visible focus ring via the global `:focus-visible` rule in `index.css` (already defined: `outline: 2px solid var(--color-accent); outline-offset: 1px;`).

- [x] **Task 5 — Add i18n keys for theme labels** (AC: #7)
  - [x] In `src/renderer/lib/i18n.tsx`, add to both `ru` and `en` objects (after the existing `sidebar.*` entries or near `toast.*` entries):
    ```ts
    // ru
    'theme.dark': 'Тёмная тема',
    'theme.light': 'Светлая тема',

    // en
    'theme.dark': 'Dark theme',
    'theme.light': 'Light theme',
    ```

- [x] **Task 6 — Write `ThemeToggle.test.tsx`** (AC: #8)
  - [x] Create `src/renderer/components/ThemeToggle.test.tsx` (testing `ThemeProvider` + toggle behavior).
  - [x] Import `{ render, screen, act, fireEvent }` from `'@testing-library/react'` and `{ describe, it, expect, beforeEach }` from `'vitest'`.
  - [x] Import `{ ThemeProvider, useTheme }` from `'./ThemeProvider'`.
  - [x] Reset `localStorage` and `document.documentElement.className` in `beforeEach`.
  - [x] Test 1 — `renders with correct initial icon based on class`:
    ```ts
    document.documentElement.classList.add('dark');
    render(<ThemeProvider><button data-testid="toggle" onClick={useTheme().toggleTheme}>toggle</button></ThemeProvider>);
    expect(screen.getByTestId('toggle')).toBeInTheDocument();
    ```
    *(Note: because `useTheme` must be inside provider, create a small consumer component for tests.)*
  - [x] Test 2 — `toggleTheme switches class and localStorage`:
    ```ts
    function Consumer() {
      const { isDark, toggleTheme } = useTheme();
      return <button onClick={toggleTheme}>{isDark ? 'dark' : 'light'}</button>;
    }
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('dark'); // because index.html script sets dark default in real app; in test set class before render
    await act(async () => { fireEvent.click(btn); });
    expect(btn.textContent).toBe('light');
    expect(localStorage.getItem('bmad-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    ```
  - [x] Test 3 — `useTheme throws outside provider`:
    ```ts
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<div>{useTheme().isDark}</div>)).toThrow();
    spy.mockRestore();
    ```
  - [x] Run `npm run test` — all existing 48 + 3 new = 51 tests should pass.

- [x] **Task 7 — Final verification** (AC: all)
  - [x] Run `npm run dev` and visually verify: app opens in dark mode; clicking sun icon switches to light instantly; reload preserves choice; no flash of white on reload.
  - [x] Run `npm run lint` — zero TypeScript errors.
  - [x] Run `npm run test` — all 51 tests pass.
  - [x] Confirm no `alert()` calls remain in `src/renderer/`.

## Dev Notes

### Critical Context from Previous Story (5a.3)

- **`project-context.md` is STALE** — it describes the old Next.js stack. The actual codebase is on branch `migrate-to-desktop` running **Electron + Vite**. Do NOT follow `project-context.md` for stack or architecture.
- `tailwind.config.js` is **CommonJS** (`module.exports`). Keep that format. Do NOT convert to ESM. It already has `darkMode: 'class'`.
- `@/*` alias resolves to `src/renderer/*` in both Vite and Vitest.
- 48 tests pass. This story should bring total to 51.
- `lucide-react` is installed. Use `Sun` and `Moon` icons.
- **Context pattern** (not Zustand) is the established pattern for UI-only state (see `Toast.tsx`). Theme is pure UI state — use React Context, same as Toast.

### No-Flash Architecture — Why the Inline Script in `index.html` is Non-Negotiable

The `ThemeProvider` React component runs **after** DOM hydration. If the theme class is only applied in React, the browser paints once without the class, then React hydrates and adds it — causing a visible flash (white → dark). The inline script in `index.html` executes **synchronously** before any CSS or JS loads, guaranteeing the correct class is on `<html>` before the first paint.

Current `index.html` has `class="dark"` hardcoded. The inline script replaces this with dynamic logic.

**Script placement rules:**
- Must be inside `<head>`.
- Must be before `main.tsx` script (obviously).
- Must be a self-executing function so it runs immediately.
- Cannot use `import`/`export` — plain JS only.

### ThemeProvider Design — Minimal and Correct

Because the inline script already handles initial class application, `ThemeProvider` does NOT need a `useEffect` that re-applies the class on mount. It only needs to:
1. Read `document.documentElement.classList.contains('dark')` once for initial React state.
2. Provide `toggleTheme` that mutates the DOM class + localStorage + React state.

This avoids double-class-application bugs and hydration mismatches.

**Why not Zustand?** Theme is UI chrome, not business logic. Context keeps it colocated and avoids adding a Zustand subscription for every component that might read `isDark`.

### Sidebar Placement

The footer section of `Sidebar.tsx` currently has (in order):
1. Settings button
2. Settings panel (conditional)
3. Sync button
4. Language toggle (RU / EN buttons)

Add the Theme Toggle button **after** the language toggle, in the same `border-t` footer block. When `collapsed` is true, show only the icon (centered). When expanded, show icon + label.

### TypeScript Patterns to Follow

- `useTheme` return type: `{ isDark: boolean; toggleTheme: () => void }`.
- No `any` types. `localStorage.getItem` returns `string | null` — handle null with default.
- `useTheme` throws a clear error if used outside `ThemeProvider`, matching `useToast` pattern.

### Source Tree: Files to Create / Modify

**NEW:**
- `src/renderer/components/ThemeProvider.tsx` — ThemeContext, ThemeProvider, useTheme hook
- `src/renderer/components/ThemeToggle.test.tsx` — 3 Vitest tests

**UPDATE:**
- `src/renderer/index.html` — replace hardcoded `class="dark"` with inline no-flash script
- `src/renderer/components/Providers.tsx` — wrap with `<ThemeProvider>` at top level
- `src/renderer/components/Sidebar.tsx` — add theme toggle button with Sun/Moon icons
- `src/renderer/lib/i18n.tsx` — add `theme.dark` and `theme.light` keys to both `ru` and `en`

**VERIFY (no change needed):**
- `src/renderer/styles/design-tokens.css` — already has `:root` and `:root.dark`; no changes
- `tailwind.config.js` — already has `darkMode: 'class'`; no changes
- `src/renderer/App.tsx` / `main.tsx` — no direct changes; `ThemeProvider` is at `Providers` level

### Testing Standards

- Vitest + `@testing-library/react` (both installed).
- `jsdom` environment is active.
- `setupFiles: ['src/renderer/setupTests.ts']` — `@testing-library/jest-dom/matchers` extended.
- Reset `localStorage` and `document.documentElement.classList` in `beforeEach` to avoid cross-test pollution.
- Suppress `console.error` in the "throws outside provider" test with `vi.spyOn`.

### What NOT to Do (Deferred to Later Stories)

- **Full component polish** (Card hover shadows, button `active:scale(0.98)`, Input styling) → **Epics 5b-i / 5b-ii**
- **Shiki/Mermaid theme-aware rendering** → deferred to 5b-ii when those components are built
- **System tray / native OS theme change listener** → not required for v1; `prefers-color-scheme` is only read at startup

### References

- UX-DR21: Theme Toggle spec [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/DESIGN.md#Theme-Toggle`]
- UX-DR24: Accessibility (focus rings) [Source: `_bmad-output/planning-artifacts/ux-designs/ux-bmad-board-2026-05-27/EXPERIENCE.md#Accessibility-Floor`]
- Architecture ADR-8: Theme System Architecture [Source: `_bmad-output/planning-artifacts/architecture.md#Theme-System-Architecture`]
- Architecture Theme Token System: CSS custom properties [Source: `_bmad-output/planning-artifacts/architecture.md#Cross-Cutting-Concerns`]
- Previous story dev notes (5a.3): tailwind.config.js is CommonJS, `@/*` alias, test count=48 [Source: `_bmad-output/implementation-artifacts/5a-3-implement-toast-system-and-win11-snappy-transitions.md`]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Implemented theme toggle with no-flash architecture: inline script in index.html sets theme before first paint; ThemeProvider reads DOM state for React sync
- Created ThemeContext/ThemeProvider/useTheme hook following the same pattern as ToastProvider
- Added Sun/Moon toggle button to Sidebar footer (collapsed/expanded responsive)
- Added i18n keys for RU and EN theme labels
- 3 new Vitest tests: renders initial state, toggle switches class+localStorage, throws outside provider
- All 55 tests pass (48 existing + 3 new + updated App tests)
- TypeScript lint clean, zero errors
- No `alert()` calls in src/renderer/

### File List

- `src/renderer/index.html` — replaced hardcoded `class="dark"` with inline no-flash theme script
- `src/renderer/components/ThemeProvider.tsx` — new: ThemeContext, ThemeProvider, useTheme hook
- `src/renderer/components/ThemeToggle.test.tsx` — new: 3 Vitest tests for theme toggle
- `src/renderer/components/Providers.tsx` — added ThemeProvider at top of provider hierarchy
- `src/renderer/components/Sidebar.tsx` — added Sun/Moon theme toggle button in footer
- `src/renderer/lib/i18n.tsx` — added `theme.dark` and `theme.light` keys for RU and EN
- `src/renderer/App.test.tsx` — wrapped renderWithProviders with ThemeProvider (fix for existing tests)

### Review Findings

- [x] [Review][Patch] Unprotected access to document/localStorage APIs in theme code [index.html:8-9, ThemeProvider.tsx:25,32, Sidebar.tsx:271]
- [x] [Review][Patch] Missing matchMedia API guard in index.html [index.html:9]
- [x] [Review][Patch] Missing aria-pressed on Sidebar theme toggle button [Sidebar.tsx:271]
- [x] [Review][Patch] Missing explicit button type in Sidebar theme toggle [Sidebar.tsx:271]
- [x] [Review][Patch] Tests use native click instead of fireEvent and async act unnecessarily [ThemeToggle.test.tsx:52-53,60-61]
- [x] [Review][Patch] Destructive global class mutation in test cleanup [ThemeToggle.test.tsx:22,27]
- [x] [Review][Patch] classList.toggle('dark') constraint ignored in ThemeProvider [ThemeProvider.tsx:26-30]
