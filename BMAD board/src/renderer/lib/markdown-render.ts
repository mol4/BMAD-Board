import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdownInline(md: string): string {
  return marked.parseInline(md) as string;
}
