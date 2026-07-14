// Typography configuration tests
// Validates that tailwind.config.js has the correct fontFamily and fontSize type ramp
// Uses require() since tailwind.config.js is CommonJS (module.exports)

import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindConfig = require('../../../tailwind.config');

describe('Tailwind fontFamily config', () => {
    it('sans fontFamily includes Inter', () => {
        const { sans } = tailwindConfig.theme.extend.fontFamily;
        expect(sans).toBeDefined();
        expect(sans.some((f: string) => f.includes('Inter'))).toBe(true);
    });

    it('mono fontFamily includes JetBrains Mono', () => {
        const { mono } = tailwindConfig.theme.extend.fontFamily;
        expect(mono).toBeDefined();
        expect(mono.some((f: string) => f.includes('JetBrains Mono'))).toBe(true);
    });
});

describe('Tailwind fontSize type ramp', () => {
    const expectedSizes: Record<string, string> = {
        display: '1.875rem',
        h1: '1.5rem',
        h2: '1.25rem',
        h3: '1rem',
        body: '0.875rem',
        'body-sm': '0.8125rem',
        caption: '0.75rem',
        mono: '0.8125rem',
    };

    it('has all required type ramp keys', () => {
        const { fontSize } = tailwindConfig.theme.extend;
        expect(fontSize).toBeDefined();
        for (const key of Object.keys(expectedSizes)) {
            expect(fontSize, `fontSize.${key} should be defined`).toHaveProperty(key);
        }
    });

    for (const [key, expectedSize] of Object.entries(expectedSizes)) {
        it(`fontSize.${key} has correct size value ${expectedSize}`, () => {
            const { fontSize } = tailwindConfig.theme.extend;
            const entry = fontSize[key];
            // entry is [size, { lineHeight, fontWeight, ... }]
            expect(Array.isArray(entry)).toBe(true);
            expect(entry[0]).toBe(expectedSize);
        });
    }

    it('display has fontWeight 700', () => {
        const entry = tailwindConfig.theme.extend.fontSize['display'];
        expect(entry[1]?.fontWeight).toBe('700');
    });

    it('body has fontWeight 400', () => {
        const entry = tailwindConfig.theme.extend.fontSize['body'];
        expect(entry[1]?.fontWeight).toBe('400');
    });

    it('caption has fontWeight 500', () => {
        const entry = tailwindConfig.theme.extend.fontSize['caption'];
        expect(entry[1]?.fontWeight).toBe('500');
    });
});
