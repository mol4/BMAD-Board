import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface DocItem {
  name: string;
  path: string;
  category: string;
}

export default function DocsPage() {
  const { t } = useI18n();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          const config = await (window as any).electronAPI.configRead();
          const response = await fetch(`file://${config.storiesDir}/../`);
          if (!response.ok) throw new Error('Failed to list docs');
        }
      } catch {
        console.log('Docs: listing not available via file:// in Electron browser — future IPC enhancement');
      }
      setDocs([]);
      setLoading(false);
    };
    loadDocs();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t('docs.title')}</h1>
      <p className="text-sm text-foreground-secondary mb-6">
        {docs.length} {t('docs.count')}
      </p>

      {loading ? (
        <p className="text-foreground-tertiary">{t('common.loading')}</p>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 text-foreground-tertiary">
          <p className="text-lg">{t('docs.noDocs')}</p>
          <p className="text-sm mt-2">{t('docs.noDocsHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <div key={doc.path} className="p-3 bg-surface-elevated rounded-lg">
              <div className="font-medium text-sm">{doc.name}</div>
              <div className="text-xs text-foreground-tertiary mt-1">{doc.path}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
