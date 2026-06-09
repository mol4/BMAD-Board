'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { storeManager } from '@/lib/store-manager';
import { useAppStore } from '@/lib/store';
import type { Project } from '../../shared/ipc-channels';
import { ChevronDown, ChevronUp, Folder } from 'lucide-react';

function formatLastUsed(iso: string | null, locale: 'ru' | 'en'): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return locale === 'ru' ? 'Только что' : 'Just now';
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return locale === 'ru' ? 'Только что' : 'Just now';
  if (diffH < 24) return locale === 'ru' ? `${diffH} ч назад` : `${diffH}h ago`;
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US');
}

interface ProjectSwitcherProps {
  collapsed: boolean;
}

export default function ProjectSwitcher({ collapsed }: ProjectSwitcherProps) {
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(true);
  const pendingRef = useRef<Promise<unknown> | null>(null);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const fetchProjects = useCallback(() => {
    if (!window.electronAPI) return;
    if (pendingRef.current) return;
    const promise = window.electronAPI.projectList().then((list) => {
      if (!mountedRef.current) return;
      const sorted = [...list].sort((a, b) => {
        const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return bTime - aTime;
      });
      setProjects(sorted);
    }).catch((err) => {
      if (mountedRef.current) {
        console.error('Failed to fetch project list:', err);
      }
    }).finally(() => {
      pendingRef.current = null;
    });
    pendingRef.current = promise;
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (!isOpen) return;
    fetchProjects();
  }, [isOpen, fetchProjects]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }
    const timer = setTimeout(() => {
      if (listRef.current) {
        const items = listRef.current.querySelectorAll('[role="option"]');
        if (items.length > 0) {
          setFocusedIndex(0);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || focusedIndex < 0) return;
    const item = listRef.current?.querySelectorAll('[role="option"]')[focusedIndex] as HTMLElement | undefined;
    item?.focus();
  }, [focusedIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || focusedIndex >= 0 || projects.length === 0) return;
    setFocusedIndex(0);
  }, [projects, isOpen, focusedIndex]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleSelect = async (projectId: string) => {
    if (isSwitching || projectId === activeProjectId) {
      if (projectId === activeProjectId) setIsOpen(false);
      return;
    }
    setIsSwitching(true);
    try {
      await storeManager.switchProject(projectId);
      showToast(t('toast.projectSwitched'), 'success');
      setIsOpen(false);
    } catch {
      showToast(t('toast.projectSwitchError'), 'error');
      setIsOpen(false);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, projects.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (e.target === buttonRef.current) {
          break;
        }
        if (focusedIndex >= 0 && focusedIndex < projects.length) {
          handleSelect(projects[focusedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-label={t('projectSwitcher.ariaLabel')}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={isSwitching}
        className={`flex items-center gap-2 w-full bg-surface-elevated text-foreground-primary border border-border-default rounded-md hover:bg-accent-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${isSwitching ? 'opacity-50 pointer-events-none' : ''} ${collapsed ? 'justify-center p-2' : 'px-3 py-2'}`}
      >
        <Folder size={18} className="shrink-0 text-foreground-tertiary" />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">
                {isSwitching
                  ? t('projectSwitcher.switching')
                  : (activeProject?.name || (projects.length === 0 ? t('projectSwitcher.noProjects') : ''))}
              </div>
              <div className="text-xs text-foreground-tertiary">
                {activeProject ? t('projectSwitcher.currentProject') : ''}
              </div>
            </div>
            {isOpen ? (
              <ChevronUp size={14} className="shrink-0 text-foreground-tertiary" />
            ) : (
              <ChevronDown size={14} className="shrink-0 text-foreground-tertiary" />
            )}
          </>
        )}
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={t('projectSwitcher.switchProject')}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface-elevated border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto min-w-[200px]"
          onKeyDown={handleKeyDown}
        >
          {projects.length === 0 && (
            <li className="px-3 py-2 text-sm text-foreground-tertiary">
              {t('projectSwitcher.noProjects')}
            </li>
          )}
          {projects.map((project, index) => {
            const isActive = project.id === activeProjectId;
            return (
              <li
                key={project.id}
                role="option"
                aria-selected={isActive}
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => handleSelect(project.id)}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
                  isActive
                    ? 'bg-accent text-foreground-on-accent'
                    : 'text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary'
                }`}
              >
                <span className="text-sm font-medium truncate">{project.name}</span>
                <span className={`text-caption shrink-0 ml-2 ${isActive ? 'text-foreground-on-accent opacity-70' : 'text-foreground-tertiary'}`}>
                  {formatLastUsed(project.lastUsedAt, locale)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
