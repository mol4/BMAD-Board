import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCodeToHtml = vi.fn().mockResolvedValue('<pre><code>highlighted</code></pre>');
const mockCreateHighlighter = vi.fn().mockResolvedValue({ codeToHtml: mockCodeToHtml });

vi.mock('shiki', () => ({
  createHighlighter: mockCreateHighlighter,
}));

let highlightCodeModule: typeof import('@/lib/highlighter');

beforeEach(async () => {
  vi.resetModules();
  mockCodeToHtml.mockClear();
  mockCreateHighlighter.mockClear();

  vi.doMock('shiki', () => ({
    createHighlighter: mockCreateHighlighter,
  }));

  highlightCodeModule = await import('@/lib/highlighter');
});

describe('highlighter', () => {
  describe('lazy initialization', () => {
    it('does not create highlighter until first highlightCode call', () => {
      expect(mockCreateHighlighter).not.toHaveBeenCalled();
    });

    it('creates highlighter on first call with correct themes', async () => {
      await highlightCodeModule.highlightCode('const x = 1;', 'typescript', true);

      expect(mockCreateHighlighter).toHaveBeenCalledTimes(1);
      expect(mockCreateHighlighter).toHaveBeenCalledWith(
        expect.objectContaining({
          themes: ['material-theme-ocean', 'light-plus'],
        })
      );
    });

    it('reuses highlighter on subsequent calls', async () => {
      await highlightCodeModule.highlightCode('const x = 1;', 'typescript', true);
      await highlightCodeModule.highlightCode('print("hi")', 'python', true);

      expect(mockCreateHighlighter).toHaveBeenCalledTimes(1);
    });
  });

  describe('theme switching', () => {
    it('uses material-theme-ocean for dark mode', async () => {
      await highlightCodeModule.highlightCode('code', 'typescript', true);
      expect(mockCodeToHtml).toHaveBeenCalledWith(
        'code',
        expect.objectContaining({ theme: 'material-theme-ocean' })
      );
    });

    it('uses light-plus for light mode', async () => {
      await highlightCodeModule.highlightCode('code', 'typescript', false);
      expect(mockCodeToHtml).toHaveBeenCalledWith(
        'code',
        expect.objectContaining({ theme: 'light-plus' })
      );
    });
  });

  describe('plaintext fallback', () => {
    it('falls back to plaintext for unknown languages', async () => {
      await highlightCodeModule.highlightCode('code', 'fakelang', true);
      expect(mockCodeToHtml).toHaveBeenCalledWith(
        'code',
        expect.objectContaining({ lang: 'plaintext' })
      );
    });

    it('uses known languages directly', async () => {
      await highlightCodeModule.highlightCode('code', 'python', true);
      expect(mockCodeToHtml).toHaveBeenCalledWith(
        'code',
        expect.objectContaining({ lang: 'python' })
      );
    });
  });

  describe('code trimming', () => {
    it('trims trailing whitespace', async () => {
      await highlightCodeModule.highlightCode('code  \n\n', 'plaintext', true);
      expect(mockCodeToHtml).toHaveBeenCalledWith(
        'code',
        expect.anything()
      );
    });
  });
});
