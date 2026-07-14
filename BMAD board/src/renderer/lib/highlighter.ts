import type { Highlighter } from 'shiki';

const LANGUAGES = new Set([
  'bash', 'bat', 'c', 'cpp', 'csharp', 'cs', 'css',
  'diff', 'docker', 'go', 'graphql', 'html',
  'java', 'javascript', 'json', 'jsonc', 'jsx',
  'kotlin', 'less', 'markdown', 'mdx', 'nginx',
  'objective-c', 'perl', 'php', 'plaintext', 'powershell',
  'prisma', 'proto', 'python', 'r', 'ruby', 'rust',
  'sass', 'scss', 'shell', 'sql',
  'swift', 'terraform', 'toml', 'tsx', 'typescript',
  'viml', 'vue', 'xml', 'yaml', 'zig'

]);

let highlighterPromise: Promise<Highlighter> | null = null;

function ensureHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter().catch((err) => {
      highlighterPromise = null;
      throw err;
    });
  }
  return highlighterPromise;
}

async function createHighlighter(): Promise<Highlighter> {
  const { createHighlighter: create } = await import('shiki');
  return create({
    themes: ['catppuccin-mocha', 'catppuccin-latte'],
    langs: [...LANGUAGES],
  });
}

export async function highlightCode(code: string, lang: string, dark: boolean): Promise<string> {
  const h = await ensureHighlighter();
  const safeLang = LANGUAGES.has(lang) ? lang : 'plaintext';
  const theme = dark ? 'catppuccin-mocha' : 'catppuccin-latte';

  return h.codeToHtml(String(code ?? '').trimEnd(), { lang: safeLang, theme });
}
