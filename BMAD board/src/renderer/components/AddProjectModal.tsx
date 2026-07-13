'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { storeManager } from '@/lib/store-manager';
import { X } from 'lucide-react';
import Input from '@/components/Input';
import type { Project, NewProject } from '../../shared/ipc-channels';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

type FormErrors = {
  name?: string;
  epicsDir?: string;
  storiesDir?: string;
  general?: string;
};

export default function AddProjectModal({ isOpen, onClose, onAdded }: AddProjectModalProps) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [epicsDir, setEpicsDir] = useState('');
  const [storiesDir, setStoriesDir] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [warning, setWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const innerRafRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      mountedRef.current = true;
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
      mountedRef.current = false;
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setEpicsDir('');
    setStoriesDir('');
    setErrors({});
    setWarning(null);
    setIsSubmitting(false);
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
      tabbable[0]?.focus();
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
  }, [mounted, onClose, getTabbableElements, isSubmitting]);

  const validateDirectory = useCallback(
    async (path: string): Promise<{ exists: boolean; mdCount: number }> => {
      if (!path || !window.electronAPI) return { exists: false, mdCount: 0 };
      try {
        const entries = await window.electronAPI.fileReadDirectory(path);
        const mdCount = entries.filter((entry) => entry.isFile && entry.name.endsWith('.md')).length;
        return { exists: true, mdCount };
      } catch {
        return { exists: false, mdCount: 0 };
      }
    },
    []
  );

  const handleBrowse = async (setter: (path: string) => void, field: keyof FormErrors) => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.dialogOpenDirectory();
    if (result.canceled || result.filePaths.length === 0) return;
    const path = result.filePaths[0];
    setter(path);
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    setWarning(null);
    const { exists, mdCount } = await validateDirectory(path);
    if (!mountedRef.current) return;
    if (!exists) {
      setErrors((prev) => ({ ...prev, [field]: t('addProject.validation.dirNotFound') }));
    } else if (mdCount === 0) {
      setWarning(t('addProject.validation.noArtifacts'));
    }
  };

  const checkDuplicate = useCallback(async (): Promise<boolean> => {
    if (!window.electronAPI) return false;
    const list = await window.electronAPI.projectList();
    return list.some((project) => project.epicsDir === epicsDir && project.storiesDir === storiesDir);
  }, [epicsDir, storiesDir]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting || !window.electronAPI) return;

    setErrors({});
    setWarning(null);

    const newErrors: FormErrors = {};
    if (!name.trim()) {
      newErrors.name = t('addProject.validation.required');
    }
    if (!epicsDir) {
      newErrors.epicsDir = t('addProject.validation.dirNotFound');
    }
    if (!storiesDir) {
      newErrors.storiesDir = t('addProject.validation.dirNotFound');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const [epicsValidation, storiesValidation] = await Promise.all([
      validateDirectory(epicsDir),
      validateDirectory(storiesDir),
    ]);

    if (!epicsValidation.exists) {
      newErrors.epicsDir = t('addProject.validation.dirNotFound');
    }
    if (!storiesValidation.exists) {
      newErrors.storiesDir = t('addProject.validation.dirNotFound');
    }

    if (epicsDir === storiesDir) {
      newErrors.general = t('addProject.validation.sameDir');
    }

    const totalMd = epicsValidation.mdCount + storiesValidation.mdCount;
    if (totalMd === 0) {
      setWarning(t('addProject.validation.noArtifacts'));
    }

    const isDuplicate = await checkDuplicate();
    if (isDuplicate) {
      newErrors.general = t('addProject.validation.duplicate');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const newProject = await window.electronAPI.projectAdd({
        name: name.trim(),
        epicsDir,
        storiesDir,
      });
      showToast(t('toast.projectAdded'), 'success');
      try {
        await storeManager.switchProject(newProject.id);
      } catch {
        showToast(t('toast.projectAddedSwitchError'), 'error');
      } finally {
        onAdded?.();
        onClose();
      }
    } catch {
      showToast(t('toast.projectAddError'), 'error');
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

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
      aria-labelledby="add-project-title"
    >
      <div
        className={`bg-surface-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 transition-all duration-200 ease-modal ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 id="add-project-title" className="text-lg font-semibold text-foreground-primary">
            {t('addProject.title')}
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

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {errors.general && (
            <div className="text-sm text-destructive">{errors.general}</div>
          )}

          <div>
            <label htmlFor="add-project-name" className="block text-sm font-medium text-foreground-secondary mb-1">
              {t('addProject.name')}
              <span className="text-destructive ml-1">*</span>
            </label>
            <Input
              sunken
              id="add-project-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="add-project-epics-dir" className="block text-sm font-medium text-foreground-secondary mb-1">
              {t('addProject.epicsDir')}
              <span className="text-destructive ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                sunken
                id="add-project-epics-dir"
                type="text"
                value={epicsDir}
                readOnly
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => handleBrowse(setEpicsDir, 'epicsDir')}
                className="px-3 py-2 bg-surface-elevated border border-border-default rounded-md hover:bg-accent-subtle text-sm text-foreground-secondary"
              >
                {t('addProject.browse')}
              </button>
            </div>
            {errors.epicsDir && <p className="mt-1 text-sm text-destructive">{errors.epicsDir}</p>}
          </div>

          <div>
            <label htmlFor="add-project-stories-dir" className="block text-sm font-medium text-foreground-secondary mb-1">
              {t('addProject.storiesDir')}
              <span className="text-destructive ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                sunken
                id="add-project-stories-dir"
                type="text"
                value={storiesDir}
                readOnly
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => handleBrowse(setStoriesDir, 'storiesDir')}
                className="px-3 py-2 bg-surface-elevated border border-border-default rounded-md hover:bg-accent-subtle text-sm text-foreground-secondary"
              >
                {t('addProject.browse')}
              </button>
            </div>
            {errors.storiesDir && (
              <p className="mt-1 text-sm text-destructive">{errors.storiesDir}</p>
            )}
          </div>

          {warning && (
            <div className="text-sm text-priority-high flex items-start gap-2">
              <span aria-hidden="true">⚠</span>
              <span>{warning}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-sunken rounded-md hover:bg-border-default transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-foreground-on-accent bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t('common.loading') : t('addProject.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
