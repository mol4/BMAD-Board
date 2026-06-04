/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "'Segoe UI'", 'system-ui', '-apple-system', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "'Fira Code'", 'monospace'],
      },
      fontSize: {
        'display': ['1.875rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1':      ['1.5rem',    { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }],
        'h2':      ['1.25rem',   { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3':      ['1rem',      { lineHeight: '1.4', fontWeight: '600' }],
        'body':    ['0.875rem',  { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem',   { lineHeight: '1.4', fontWeight: '500' }],
        'mono':    ['0.8125rem', { lineHeight: '1.55', fontWeight: '400' }],
      },
      colors: {
        surface: {
          base: 'var(--color-surface-base)',
          elevated: 'var(--color-surface-elevated)',
          sunken: 'var(--color-surface-sunken)',
          overlay: 'var(--color-surface-overlay)',
        },
        foreground: {
          primary: 'var(--color-foreground-primary)',
          secondary: 'var(--color-foreground-secondary)',
          tertiary: 'var(--color-foreground-tertiary)',
          'on-accent': 'var(--color-foreground-on-accent)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          light: 'var(--color-accent-light)',
          subtle: 'var(--color-accent-subtle)',
        },
        border: {
          default: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
        },
        status: {
          backlog: {
            bg: 'var(--color-status-backlog-bg)',
            fg: 'var(--color-status-backlog-fg)',
          },
          todo: {
            bg: 'var(--color-status-todo-bg)',
            fg: 'var(--color-status-todo-fg)',
          },
          'in-progress': {
            bg: 'var(--color-status-in-progress-bg)',
            fg: 'var(--color-status-in-progress-fg)',
          },
          'in-review': {
            bg: 'var(--color-status-in-review-bg)',
            fg: 'var(--color-status-in-review-fg)',
          },
          done: {
            bg: 'var(--color-status-done-bg)',
            fg: 'var(--color-status-done-fg)',
          },
          draft: {
            bg: 'var(--color-status-draft-bg)',
            fg: 'var(--color-status-draft-fg)',
          },
          ready: {
            bg: 'var(--color-status-ready-bg)',
            fg: 'var(--color-status-ready-fg)',
          },
        },
        priority: {
          critical: 'var(--color-priority-critical)',
          high: 'var(--color-priority-high)',
          medium: 'var(--color-priority-medium)',
          low: 'var(--color-priority-low)',
        },
        code: {
          'inline-bg': 'var(--color-code-inline-bg)',
          'inline-fg': 'var(--color-code-inline-fg)',
          'block-bg': 'var(--color-code-block-bg)',
          'block-fg': 'var(--color-code-block-fg)',
        },
        destructive: 'var(--color-destructive)',
      },
      transitionTimingFunction: {
        'win11': 'cubic-bezier(0, 0, 0.58, 1)',
        'modal': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'toast-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'modal-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-in': 'modal-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
