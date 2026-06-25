'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { storeManager } from '@/lib/store-manager';
import { X, AlertTriangle } from 'lucide-react';
import type { Project } from '../../shared/ipc-channels';

interface RemoveProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onRemoved?: () => void;
}

export default function RemoveProjectDialog({
  isOpen,
  onClose,
  project,
  onRemoved,
}: RemoveProjectDialogProps) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
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
      const removeButton = tabbable.find((el) => el.dataset.action === 'remove');
      (removeButton ?? tabbable[0])?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSubmitting) return;
        e.preventDefault();
        onClose();
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
  }, [mounted, onClose, getTabbableElements]);

  const handleConfirm = async () => {
    if (!project || isSubmitting || !window.electronAPI) return;

    setIsSubmitting(true);
    try {
      await window.electronAPI.projectRemove({ projectId: project.id });
      showToast(t('toast.projectRemoved'), 'success');
      onRemoved?.();

      const activeProjectId = storeManager.getActiveProjectId();
      if (activeProjectId === project.id) {
        const remaining = await window.electronAPI.projectList();
        try {
          if (remaining.length > 0) {
            await storeManager.switchProject(remaining[0].id);
          } else {
            window.location.hash = '#/welcome';
          }
        } catch (switchErr) {
          console.error('[RemoveProject] Failed to switch after removal:', switchErr);
          window.location.hash = '#/welcome';
        }
      }

      onClose();
    } catch {
      showToast(t('toast.projectRemoveError'), 'error');
      setIsSubmitting(false);
    }
  };

  if (!mounted || !project) return null;

  return (
    <div
      ref={modalRef}
      className={`fixed inset-0 bg-surface-overlay flex items-center justify-center z-50 transition-opacity duration-200 ease-win11 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (isSubmitting) return;
        if (e.target === modalRef.current) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-project-title"
    >
      <div
        className={`bg-surface-elevated rounded-lg shadow-xl w-full max-w-md mx-4 transition-all duration-200 ease-modal ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 id="remove-project-title" className="text-lg font-semibold text-foreground-primary">
            {t('removeProject.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-accent-subtle transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} className="text-foreground-tertiary" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-foreground-primary">
            <span className="font-medium">{project.name}</span>{' '}
            {t('removeProject.message')}
          </p>

          <div className="flex items-start gap-2 text-sm text-priority-high">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{t('removeProject.confirmation')}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-sunken rounded-md hover:bg-border-default transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              data-action="remove"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t('common.loading') : t('removeProject.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
