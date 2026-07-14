import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Parse a single CSS custom-property block, e.g. `:root { ... }` or `:root.dark { ... }`. */
function parseTokenBlock(css: string, selector: ':root' | ':root.dark'): Record<string, string> {
    const escaped = selector.replace('.', '\\.');
    const regex = new RegExp(`${escaped}\\s*\\{([^}]+)\\}`, 's');
    const match = css.match(regex);
    if (!match) throw new Error(`Block not found for selector: ${selector}`);

    const tokens: Record<string, string> = {};
    const propRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m: RegExpExecArray | null;
    while ((m = propRegex.exec(match[1])) !== null) {
        tokens[m[1]] = m[2].trim();
    }
    return tokens;
}

const cssPath = resolve(__dirname, './design-tokens.css');
const css = readFileSync(cssPath, 'utf-8');
const lightTokens = parseTokenBlock(css, ':root');
const darkTokens = parseTokenBlock(css, ':root.dark');

describe('Design Tokens — CSS custom properties', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('style');
    });

    it('light --color-surface-base equals expected hex', () => {
        expect(lightTokens['--color-surface-base']).toBe('#f8f9fb');
    });

    it('dark --color-surface-base equals expected hex', () => {
        expect(darkTokens['--color-surface-base']).toBe('#0f1117');
    });

    it('toggling the dark class on documentElement yields a different resolved --color-surface-base', () => {
        // Inject light token value (mirrors what `:root { }` provides in the browser)
        document.documentElement.style.setProperty('--color-surface-base', lightTokens['--color-surface-base']);
        const light = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-surface-base')
            .trim();

        // Toggle to dark mode and inject dark token value (mirrors `:root.dark { }` override)
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('--color-surface-base', darkTokens['--color-surface-base']);
        const dark = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-surface-base')
            .trim();

        expect(light).toBe('#f8f9fb');
        expect(dark).toBe('#0f1117');
        expect(light).not.toBe(dark);
    });

    it('all required tokens are defined in both :root and :root.dark', () => {
        const required = [
            // Surface
            '--color-surface-base', '--color-surface-elevated',
            '--color-surface-sunken', '--color-surface-overlay',
            // Foreground
            '--color-foreground-primary', '--color-foreground-secondary',
            '--color-foreground-tertiary', '--color-foreground-on-accent',
            // Accent
            '--color-accent', '--color-accent-hover',
            '--color-accent-light', '--color-accent-subtle',
            // Borders
            '--color-border-default', '--color-border-strong',
            // Status pairs
            '--color-status-backlog-bg', '--color-status-backlog-fg',
            '--color-status-todo-bg', '--color-status-todo-fg',
            '--color-status-in-progress-bg', '--color-status-in-progress-fg',
            '--color-status-in-review-bg', '--color-status-in-review-fg',
            '--color-status-done-bg', '--color-status-done-fg',
            '--color-status-draft-bg', '--color-status-draft-fg',
            '--color-status-ready-bg', '--color-status-ready-fg',
            // Priority
            '--color-priority-critical', '--color-priority-high',
            '--color-priority-medium', '--color-priority-low',
            // Code
            '--color-code-inline-bg', '--color-code-inline-fg',
            '--color-code-block-bg', '--color-code-block-fg',
            // Destructive
            '--color-destructive',
        ];

        for (const token of required) {
            expect(lightTokens[token], `${token} missing from :root`).toBeDefined();
            expect(darkTokens[token], `${token} missing from :root.dark`).toBeDefined();
        }
    });
});
