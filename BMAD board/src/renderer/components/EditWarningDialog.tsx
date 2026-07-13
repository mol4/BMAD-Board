'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { X } from 'lucide-react';

let sessionDismissed = false;

export function isEditWarningDismissedForSession(): boolean {
    return sessionDismissed;
}

export function dismissEditWarningForSession(): void {
    sessionDismissed = true;
}

interface EditWarningDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    dontShowAgain: boolean;
    onDontShowAgainChange: (value: boolean) => void;
}

export default function EditWarningDialog({
    isOpen,
    onConfirm,
    onCancel,
    dontShowAgain,
    onDontShowAgainChange,
}: EditWarningDialogProps) {
    const { t } = useI18n();
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const innerRafRef = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            const raf1 = requestAnimationFrame(() => {
                innerRafRef.current = requestAnimationFrame(() => setVisible(true));
            });
            return () => {
                cancelAnimationFrame(raf1);
                if (innerRafRef.current !== null) {
                    cancelAnimationFrame(innerRafRef.current);
                    innerRafRef.current = null;
                }
            };
        } else {
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const getTabbableElements = useCallback((): HTMLElement[] => {
        const modal = modalRef.current;
        if (!modal) return [];
        return Array.from(
            modal.querySelectorAll<HTMLElement>(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => !(el as HTMLButtonElement).disabled);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(() => {
            const tabbable = getTabbableElements();
            const confirmButton = tabbable.find((el) => el.dataset.action === 'confirm');
            (confirmButton ?? tabbable[0])?.focus();
        }, 0);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
                return;
            }

            if (e.key !== 'Tab') return;

            const tabbable = getTabbableElements();
            if (tabbable.length === 0) return;

            const currentIndex = tabbable.indexOf(document.activeElement as HTMLElement);
            if (currentIndex === -1) return;

            e.preventDefault();
            if (e.shiftKey) {
                const nextIndex = currentIndex === 0 ? tabbable.length - 1 : currentIndex - 1;
                tabbable[nextIndex].focus();
            } else {
                const nextIndex = currentIndex === tabbable.length - 1 ? 0 : currentIndex + 1;
                tabbable[nextIndex].focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [mounted, onCancel, getTabbableElements]);

    if (!mounted) return null;

    return (
        <div
            ref={modalRef}
            className={`fixed inset-0 bg-surface-overlay backdrop-blur-[4px] flex items-center justify-center z-50 transition-opacity duration-200 ease-modal ${
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => {
                if (e.target === modalRef.current) {
                    onCancel();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-warning-title"
        >
            <div
                className={`bg-surface-elevated rounded-xl shadow-xl w-full max-w-md mx-4 transition-all duration-200 ease-modal ${
                    visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]'
                }`}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
                    <h2 id="edit-warning-title" className="text-lg font-semibold text-foreground-primary">
                        {t('editor.edit')}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 rounded hover:bg-accent-subtle transition-colors"
                        aria-label={t('common.close')}
                    >
                        <X size={18} className="text-foreground-tertiary" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                        {t('manualEdit.warning')}
                    </p>

                    <label className="flex items-center gap-2 text-sm text-foreground-secondary cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={(e) => onDontShowAgainChange(e.target.checked)}
                            className="h-4 w-4 rounded border-border-default text-accent focus:ring-2 focus:ring-accent"
                        />
                        {t('manualEdit.dontShowAgain')}
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-sunken rounded-md hover:bg-border-default transition-colors"
                        >
                            {t('editor.cancel')}
                        </button>
                        <button
                            type="button"
                            data-action="confirm"
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-foreground-on-accent bg-accent rounded-md hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                            {t('manualEdit.confirm')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
