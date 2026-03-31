'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface DocDetail {
  id: string;
  fileName: string;
  relPath: string;
  content: string;
  ext: string;
}

export default function DocDetailPage() {
  const params = useParams();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [editingMd, setEditingMd] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    fetch(`/api/docs/${params.id}`)
      .then((r) => r.json())
      .then(async (data: DocDetail) => {
        setDoc(data);
        await renderContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const renderContent = async (data: DocDetail) => {
    if (data.ext === 'html') {
      setRenderedHtml(data.content);
    } else {
      const { marked } = await import('marked');
      marked.setOptions({ breaks: true, gfm: true });
      const html = await marked.parse(data.content);
      setRenderedHtml(html);
    }
  };

  const handleEditClick = () => {
    setShowEditWarning(true);
  };

  const handleConfirmEdit = () => {
    setShowEditWarning(false);
    setEditValue(doc?.content || '');
    setEditingMd(true);
  };

  const handleCancelEdit = () => {
    setEditingMd(false);
    setEditValue('');
  };

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      await fetch(`/api/docs/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editValue }),
      });
      const updated = { ...doc, content: editValue };
      setDoc(updated);
      await renderContent(updated);
      setEditingMd(false);
      setEditValue('');
    } catch {
      alert(t('docs.saveError'));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jira-blue"></div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-8 text-center text-jira-gray-500">
        <p className="text-4xl mb-4">😿</p>
        <p>{t('docs.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-jira-gray-500 mb-6">
        <Link href="/docs" className="hover:text-jira-blue">
          {t('docs.breadcrumb')}
        </Link>
        <span>/</span>
        <span className="text-jira-gray-900">{doc.fileName}</span>
      </div>

      {showEditWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-jira-gray-900">{t('docs.editFile')}</h3>
            </div>
            <p className="text-sm text-jira-gray-600 mb-6">
              {t('docs.editWarning')} <strong className="font-mono">{doc.fileName}</strong>.
              {t('docs.editWarningText')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditWarning(false)}
                className="px-4 py-2 text-sm text-jira-gray-600 hover:text-jira-gray-800 border border-jira-gray-300 rounded-md hover:bg-jira-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-2 text-sm text-white bg-jira-blue rounded-md hover:bg-jira-blue-dark transition-colors"
              >
                {t('common.continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-jira-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-jira-gray-200">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
              doc.ext === 'html' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {doc.ext.toUpperCase()}
            </div>
            <span className="text-sm font-mono text-jira-gray-600">{doc.relPath}</span>
          </div>
          {!editingMd && (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-jira-gray-600 border border-jira-gray-300 rounded-md hover:bg-jira-gray-50 hover:text-jira-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('common.edit')}
            </button>
          )}
        </div>

        {editingMd ? (
          <div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full h-[600px] p-4 font-mono text-sm border border-jira-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jira-blue focus:border-transparent resize-y bg-jira-gray-50"
              spellCheck={false}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 text-sm text-jira-gray-600 border border-jira-gray-300 rounded-md hover:bg-jira-gray-50 transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>}
                {t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <article
            className="prose prose-sm max-w-none prose-headings:text-jira-gray-900 prose-p:text-jira-gray-700 prose-strong:text-jira-gray-800 prose-code:text-pink-600 prose-code:bg-jira-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-jira-gray-900 prose-pre:text-gray-100 prose-li:text-jira-gray-700 prose-a:text-jira-blue prose-table:text-sm prose-th:bg-jira-gray-50 prose-th:p-2 prose-td:p-2"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}
      </div>
    </div>
  );
}