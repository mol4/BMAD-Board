import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface MarkdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    markdownContent: string | null | undefined;
    /** Full path to the file — shown as subtitle when provided */
    filePath?: string;
}

export default function MarkdownModal({ isOpen, onClose, title, markdownContent, filePath }: MarkdownModalProps) {
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (!markdownContent) {
            setHtml('');
            return;
        }
        setLoading(true);
        import('marked').then(({ marked }) => {
            marked.setOptions({ breaks: true, gfm: true });
            const result = marked.parse(markdownContent);
            if (result instanceof Promise) {
                result.then((h) => { setHtml(h); setLoading(false); });
            } else {
                setHtml(result);
                setLoading(false);
            }
        });
    }, [isOpen, markdownContent]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-surface-overlay flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-surface-elevated rounded-lg shadow-xl flex flex-col w-full max-w-4xl mx-4 max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-border-default shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-h3 font-semibold text-foreground-primary truncate">{title}</h2>
                        {filePath && (
                            <p className="text-caption text-foreground-tertiary font-mono mt-0.5 truncate">{filePath}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 shrink-0 p-1 rounded hover:bg-accent-subtle transition-colors"
                    >
                        <X size={18} className="text-foreground-tertiary" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-5 flex-1">
                    {loading ? (
                        <p className="text-foreground-tertiary text-sm">Загрузка...</p>
                    ) : html ? (
                        <div
                            className="prose prose-invert prose-sm max-w-none
                prose-headings:text-foreground-primary prose-headings:font-semibold
                prose-p:text-foreground-secondary
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-code:text-foreground-primary prose-code:bg-surface-sunken prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
                prose-pre:bg-surface-sunken prose-pre:border prose-pre:border-border-subtle
                prose-blockquote:border-l-accent prose-blockquote:text-foreground-tertiary
                prose-strong:text-foreground-primary
                prose-li:text-foreground-secondary
                prose-hr:border-border-subtle
                prose-table:text-foreground-secondary
                prose-th:text-foreground-primary prose-th:border prose-th:border-border-subtle
                prose-td:border prose-td:border-border-subtle"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    ) : (
                        <p className="text-foreground-tertiary text-sm">Нет содержимого</p>
                    )}
                </div>
            </div>
        </div>
    );
}
