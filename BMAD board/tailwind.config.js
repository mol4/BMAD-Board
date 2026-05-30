/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
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
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
