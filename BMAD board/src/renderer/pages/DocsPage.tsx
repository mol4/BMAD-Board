import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { writeMarkdownFile } from '@/lib/file-writer';
import { getConfig } from '@/lib/config';
import { useAppStore } from '@/lib/store';
import MarkdownModal from '@/components/MarkdownModal';
import { FileText } from 'lucide-react';

interface DocItem {
  name: string;
  path: string;
  category: string;
}

async function scanDirectory(
  dirPath: string,
  category = 'root',
  api: NonNullable<typeof window.electronAPI>,
): Promise<DocItem[]> {
  const entries = await api.fileReadDirectory(dirPath);
  const docs: DocItem[] = [];

  for (const entry of entries) {
    if (entry.isFile && entry.name.endsWith('.md')) {
      docs.push({ name: entry.name, path: entry.path, category });
    } else if (!entry.isFile) {
      const subDocs = await scanDirectory(entry.path, entry.name, api);
      docs.push(...subDocs);
    }
  }

  return docs;
}

export default function DocsPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const [loading, setLoading] = useState(true);
  const [mdModalOpen, setMdModalOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string | null>(null);
  const [mdTitle, setMdTitle] = useState('');
  const [mdPath, setMdPath] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const loadDocs = async () => {
      setLoading(true);
      try {
        if (typeof window !== 'undefined' && window.electronAPI) {
          const config = getConfig();
          const result = await scanDirectory(config.epicsDir, 'root', window.electronAPI);
          setDocs(result);
        }
      } catch (err) {
        console.warn('Docs: failed to scan planning artifacts:', err);
        setDocs([]);
      }
      setLoading(false);
    };
    loadDocs();
  }, [activeProjectId]);

  const openDoc = async (path: string) => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.fileRead(path);
    if (result.exists) {
      setMdContent(result.content);
      setMdTitle(path.split(/[\\/]/).pop() || path);
      setMdPath(path);
      setMdModalOpen(true);
    }
  };

  const handleSaveMarkdown = async (content: string) => {
    if (!mdPath) return;
    const result = await writeMarkdownFile(mdPath, content);
    if (!result.ok && mountedRef.current) {
      if (result.code === 'FILE_LOCKED') {
        showToast(t('toast.fileLockedByAgent'), 'error');
      } else if (result.code === 'FILE_CHANGED') {
        showToast(t('toast.fileChanged'), 'error');
      } else {
        showToast(t('toast.editSaveFailed'), 'error');
      }
      return;
    }
    if (mountedRef.current && result.ok) {
      setMdContent(content);
    }
  };

  const grouped = docs.reduce<Record<string, DocItem[]>>((acc, doc) => {
    const cat = doc.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const categoryOrder = ['root', ...Object.keys(grouped).filter((c) => c !== 'root').sort()];

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
        <div className="space-y-6">
          {categoryOrder.map((category) => (
            <section key={category}>
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase mb-2">
                {category === 'root' ? t('docs.rootCategory') : category}
              </h2>
              <div className="space-y-2">
                {grouped[category].map((doc) => (
                  <button
                    key={doc.path}
                    onClick={() => openDoc(doc.path)}
                    className="w-full text-left p-3 bg-surface-elevated rounded-lg hover:bg-accent-subtle transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-foreground-tertiary group-hover:text-foreground-secondary shrink-0" />
                      <div className="font-medium text-sm text-foreground-primary">{doc.name}</div>
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-1 truncate">{doc.path}</div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <MarkdownModal
        isOpen={mdModalOpen}
        onClose={() => setMdModalOpen(false)}
        title={mdTitle}
        markdownContent={mdContent}
        filePath={mdPath}
        editable={!!mdPath}
        onSave={handleSaveMarkdown}
      />
    </div>
  );
}
