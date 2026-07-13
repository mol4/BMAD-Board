'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Pencil } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import EditWarningDialog, { isEditWarningDismissedForSession, dismissEditWarningForSession } from './EditWarningDialog';
import matter from 'gray-matter';

interface MarkdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    markdownContent: string | null | undefined;
    /** Full path to the file — shown as subtitle when provided */
    filePath?: string;
    /** Enable edit button in header */
    editable?: boolean;
    /** Called when user confirms save; returns promise */
    onSave?: (content: string) => Promise<void>;
}

export default function MarkdownModal({ isOpen, onClose, title, markdownContent, filePath, editable, onSave }: MarkdownModalProps) {
    const { t } = useI18n();
    const { showToast } = useToast();

    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(isEditWarningDismissedForSession());
    const inFlightRef = useRef(false);

    // Reset edit state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            setDraftContent('');
            setWarningOpen(false);
            setDontShowAgain(false);
        }
    }, [isOpen]);

    // Parse markdown when content or modal opens
    useEffect(() => {
        if (!isOpen || isEditing) return;
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
    }, [isOpen, markdownContent, isEditing]);

    // Escape key handler
    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;

            if (warningOpen) {
                handleWarningCancel();
                return;
            }

            if (isEditing) {
                e.preventDefault();
                handleCancelEdit();
                return;
            }

            onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose, isEditing, warningOpen]);

    const showEditMode = editable && filePath;

    const handleEditClick = useCallback(() => {
        const dismissed = isEditWarningDismissedForSession();
        if (dismissed) {
            setIsEditing(true);
            setDraftContent(markdownContent ?? '');
            return;
        }
        setWarningOpen(true);
    }, [markdownContent]);

    const handleWarningConfirm = useCallback(() => {
        setWarningOpen(false);
        if (dontShowAgain) {
            dismissEditWarningForSession();
        }
        setIsEditing(true);
        setDraftContent(markdownContent ?? '');
    }, [dontShowAgain, markdownContent]);

    const handleWarningCancel = useCallback(() => {
        setWarningOpen(false);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setDraftContent('');
    }, []);

    const handleSave = useCallback(async () => {
        if (isSaving || inFlightRef.current) return;

        try {
            matter(draftContent);
        } catch {
            showToast(t('toast.invalidFrontmatter'), 'error');
            return;
        }

        if (!onSave) return;

        inFlightRef.current = true;
        setIsSaving(true);

        try {
            await onSave(draftContent);
            const { marked } = await import('marked');
            marked.setOptions({ breaks: true, gfm: true });
            const result = marked.parse(draftContent);
            const newHtml = result instanceof Promise ? await result : result;
            setHtml(newHtml);
            setIsEditing(false);
            setDraftContent('');
            showToast(t('toast.editSaved'), 'success');
        } catch {
            showToast(t('toast.editSaveFailed'), 'error');
        } finally {
            setIsSaving(false);
            inFlightRef.current = false;
        }
    }, [draftContent, isSaving, onSave, showToast, t]);

    if (!isOpen) return null;

    return (
        <>
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
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                            {showEditMode && !isEditing && (
                                <button
                                    onClick={handleEditClick}
                                    className="p-1 rounded hover:bg-accent-subtle transition-colors"
                                    aria-label={t('editor.edit')}
                                    title={t('editor.edit')}
                                >
                                    <Pencil size={16} className="text-foreground-tertiary" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-1 rounded hover:bg-accent-subtle transition-colors"
                                aria-label={t('common.close')}
                            >
                                <X size={18} className="text-foreground-tertiary" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    {isEditing ? (
                        <textarea
                            value={draftContent}
                            onChange={(e) => setDraftContent(e.target.value)}
                            className="w-full flex-1 bg-surface-sunken border border-border-default rounded text-foreground-primary font-mono text-sm p-3 resize-vertical min-h-[300px] focus:outline-none focus:ring-2 focus:ring-accent"
                            aria-label={t('editor.edit')}
                        />
                    ) : (
                        <div className="overflow-y-auto px-6 py-5 flex-1">
                            {loading ? (
                                <p className="text-foreground-tertiary text-sm">{t('common.loading')}</p>
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
                                <p className="text-foreground-tertiary text-sm">{t('common.noDescription')}</p>
                            )}
                        </div>
                    )}

                    {/* Footer (edit mode only) */}
                    {isEditing && (
                        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-border-default shrink-0">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-sunken rounded-md hover:bg-border-default transition-colors"
                            >
                                {t('editor.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-foreground-on-accent bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
                            >
                                {isSaving ? t('common.loading') : t('editor.save')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <EditWarningDialog
                isOpen={warningOpen}
                onConfirm={handleWarningConfirm}
                onCancel={handleWarningCancel}
                dontShowAgain={dontShowAgain}
                onDontShowAgainChange={setDontShowAgain}
            />
        </>
    );
}
