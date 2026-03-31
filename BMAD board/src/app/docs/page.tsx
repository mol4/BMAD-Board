'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface Doc {
  id: string;
  name: string;
  fileName: string;
  relPath: string;
  category: string;
  ext: string;
  size: number;
  updatedAt: string;
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const { t, locale } = useI18n();

  useEffect(() => {
    fetch('/api/docs')
      .then((r) => r.json())
      .then((data) => {
        setDocs(data);
        setLoading(false);
      });
  }, []);

  const categories = ['all', ...Array.from(new Set(docs.map((d) => d.category)))];
  const filtered = filterCategory === 'all' ? docs : docs.filter((d) => d.category === filterCategory);

  const grouped = filtered.reduce<Record<string, Doc[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-jira-gray-900">{t('docs.title')}</h1>
          <p className="text-sm text-jira-gray-500 mt-1">
            {docs.length} {t('docs.count')}
          </p>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-sm border border-jira-gray-300 rounded-lg px-3 py-2 bg-white text-jira-gray-700"
        >
            <option value="all">{t('docs.allCategories')}</option>
          {categories.filter((c) => c !== 'all').map((c) => (
            <option key={c} value={c}>{t(`category.${c}` as any) || c}</option>
          ))}
        </select>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-lg border border-jira-gray-200 p-12 text-center text-jira-gray-500">
          <p className="text-4xl mb-4">📄</p>
          <p className="text-lg font-medium mb-2">{t('docs.noDocs')}</p>
          <p className="text-sm">{t('docs.noDocsHint')}</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryDocs]) => (
          <div key={category} className="mb-6">
            <h2 className="text-sm font-semibold text-jira-gray-500 uppercase tracking-wider mb-3">
              {t(`category.${category}` as any) || category} ({categoryDocs.length})
            </h2>
            <div className="bg-white rounded-lg border border-jira-gray-200 divide-y divide-jira-gray-100">
              {categoryDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/docs/${doc.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-jira-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                      doc.ext === 'html' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {doc.ext.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-jira-gray-900">{doc.name}</p>
                      <p className="text-xs text-jira-gray-400 font-mono">{doc.relPath}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-jira-gray-400">
                    <p>{(doc.size / 1024).toFixed(1)} KB</p>
                    <p>{new Date(doc.updatedAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}