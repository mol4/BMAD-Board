import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { marked } from 'marked';
import { highlightCode } from '@/lib/highlighter';
import MermaidRenderer from '@/components/MermaidRenderer';

interface RichMarkdownProps {
  markdown: string;
  className?: string;
}

interface CodeBlock {
  id: string;
  code: string;
  lang: string;
  isMermaid: boolean;
}

const PLACEHOLDER_ATTR = 'data-cb-id';

export default function RichMarkdown({ markdown, className }: RichMarkdownProps) {
  const [html, setHtml] = useState<string>('');
  const [mermaidBlocks, setMermaidBlocks] = useState<CodeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = useIsDark();
  const containerRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef(0);
  const [portalTargets, setPortalTargets] = useState<Map<string, Element>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const v = ++versionRef.current;

    async function render() {
      setLoading(true);

      const codeBlocks: CodeBlock[] = [];
      let blockIndex = 0;

      const renderer = new marked.Renderer();

      renderer.code = function (code: string, infostring: string | undefined): string {
        const lang = infostring || 'plaintext';
        const id = `cb-${blockIndex++}`;
        codeBlocks.push({ id, code, lang, isMermaid: lang === 'mermaid' });
        return `<div ${PLACEHOLDER_ATTR}="${id}"></div>`;
      };

      const parsedHtml = marked.parse(markdown, { async: false, renderer }) as string;
      const resolvedHtml = await resolveCodeBlocks(parsedHtml, codeBlocks, isDark);

      if (cancelled || v !== versionRef.current) return;

      setHtml(resolvedHtml);
      setMermaidBlocks(codeBlocks.filter((b) => b.isMermaid));
      setLoading(false);
    }

    render();
    return () => { cancelled = true; };
  }, [markdown, isDark]);

  useEffect(() => {
    if (!containerRef.current || mermaidBlocks.length === 0) return;
    requestAnimationFrame(() => {
      const targets = new Map<string, Element>();
      for (const block of mermaidBlocks) {
        const el = containerRef.current?.querySelector(`[${PLACEHOLDER_ATTR}="${block.id}"]`);
        if (el) targets.set(block.id, el);
      }
      setPortalTargets(targets);
    });
  }, [html, mermaidBlocks]);

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-sunken rounded w-3/4" />
          <div className="h-4 bg-surface-sunken rounded w-1/2" />
          <div className="h-20 bg-surface-sunken rounded" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {mermaidBlocks.map((block) => {
        const placeholder = portalTargets.get(block.id);
        if (!placeholder) return null;
        return createPortal(
          <MermaidRenderer code={block.code} isDark={isDark} />,
          placeholder,
          block.id,
        );
      })}
    </div>
  );
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains('dark'));
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

async function resolveCodeBlocks(html: string, blocks: CodeBlock[], dark: boolean): Promise<string> {
  const nonMermaid = blocks.filter((b) => !b.isMermaid);

  const highlighted = await Promise.all(
    nonMermaid.map(async (b) => {
      try {
        return await highlightCode(b.code, b.lang, dark);
      } catch {
        const e = escapeHtml(b.code);
        return `<pre tabindex="0" style="background-color:var(--color-code-block-bg,#1E1E2E);color:var(--color-foreground-secondary,#CDD6F4)"><code style="display:block;padding:1rem">${e}</code></pre>`;
      }
    })
  );

  let result = html;

  for (let i = 0; i < nonMermaid.length; i++) {
    const block = nonMermaid[i];
    const placeholder = `<div ${PLACEHOLDER_ATTR}="${block.id}"></div>`;
    const badge = block.lang && block.lang !== 'plaintext'
      ? `<span class="absolute top-2 left-2 z-10 text-caption text-foreground-tertiary bg-surface-sunken rounded-sm px-1.5 py-0.5">${escapeHtml(block.lang)}</span>`
      : '';
    const codeHtml = highlighted[i].replace('<pre', '<pre tabindex="0"');
    const replacement = `<div ${PLACEHOLDER_ATTR}="${block.id}" class="relative rounded-lg overflow-hidden">${badge}${codeHtml}</div>`;
    result = result.replace(placeholder, replacement);
  }

  return result;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
