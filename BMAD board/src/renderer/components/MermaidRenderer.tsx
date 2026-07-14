import { useState, useEffect, useId } from 'react';
import { useI18n } from '@/lib/i18n';

interface MermaidRendererProps {
  code: string;
  isDark: boolean;
}

const LIGHT_THEME_VARS = {
  primaryColor: '#0D9488',
  primaryTextColor: '#1A1D23',
  primaryBorderColor: '#E2E4EA',
  lineColor: '#E2E4EA',
  secondaryColor: '#F0F1F5',
  tertiaryColor: '#FFFFFF',
  fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
};

const DARK_THEME_VARS = {
  primaryColor: '#2DD4BF',
  primaryTextColor: '#E8EAED',
  primaryBorderColor: '#2A2D3A',
  lineColor: '#2A2D3A',
  secondaryColor: '#0A0C12',
  tertiaryColor: '#181B23',
  fontFamily: 'Inter, Segoe UI, system-ui, sans-serif',
};

let mermaidInitKey: string | null = null;

export default function MermaidRenderer({ code, isDark }: MermaidRendererProps) {
  const { t } = useI18n();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const uniqueId = useId();

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setLoading(true);
      setError(null);
      setSvg(null);

      try {
        const mermaid = (await import('mermaid')).default;

        const initKey = isDark ? 'dark' : 'light';
        if (mermaidInitKey !== initKey) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: isDark ? DARK_THEME_VARS : LIGHT_THEME_VARS,
          });
          mermaidInitKey = initKey;
        }

        const id = `mermaid-${uniqueId.replace(/:/g, '-')}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);

        if (!cancelled) {
          if (renderedSvg && typeof renderedSvg === 'string') {
            setSvg(renderedSvg);
          } else {
            setError('Empty render result');
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [code, isDark, uniqueId]);

  if (loading) {
    return (
      <div
        className="animate-pulse bg-surface-sunken rounded-lg w-full aspect-video"
        role="img"
        aria-busy="true"
        aria-label={t('mermaid.loading')}
      />
    );
  }

  if (error) {
    return (
      <div className="rounded-lg overflow-hidden">
        <pre className="bg-surface-sunken p-4 overflow-x-auto text-sm font-mono text-foreground-secondary">
          {code}
        </pre>
        <div
          className="text-destructive bg-destructive/10 rounded-sm px-2 py-1 text-sm"
          role="alert"
          aria-live="assertive"
        >
          {t('mermaid.renderError')}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      role="img"
      aria-label="Mermaid diagram"
    >
      <span className="absolute top-2 left-2 text-caption text-foreground-tertiary bg-surface-sunken rounded-sm px-1.5 py-0.5 z-10">
        mermaid
      </span>
      <div
        className="w-full flex justify-center"
        style={{ backgroundColor: isDark ? '#181B23' : '#FFFFFF' }}
        dangerouslySetInnerHTML={{ __html: svg || '' }}
      />
    </div>
  );
}
