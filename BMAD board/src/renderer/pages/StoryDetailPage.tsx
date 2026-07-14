import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { writeMarkdownFile } from '@/lib/file-writer';
import { FileText } from 'lucide-react';
import MarkdownModal from '@/components/MarkdownModal';
import StoryDetailTabs from '@/components/StoryDetailTabs';
import type { Story } from '@/lib/types';

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { showToast } = useToast();
  const initialized = useAppStore((s) => s.initialized);
  const [story, setStory] = useState<Story | null>(null);
  const [notFound, setNotFound] = useState(false);
  const getStory = useAppStore((s) => s.getStory);
  const getStoryByKey = useAppStore((s) => s.getStoryByKey);
  const getEpic = useAppStore((s) => s.getEpic);
  const [mdModalOpen, setMdModalOpen] = useState(false);
  const [mdContent, setMdContent] = useState<string | null>(null);
  const [mdStartInEdit, setMdStartInEdit] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const openMdModal = async (s: Story, startInEdit = false) => {
    let content = s.rawMarkdown ?? null;
    if (!content && s.sourceFile) {
      const result = await window.electronAPI?.fileRead(s.sourceFile);
      content = result?.content ?? null;
    }
    setMdContent(content);
    setMdStartInEdit(startInEdit);
    setMdModalOpen(true);
  };

  const loadMarkdown = useCallback(async () => {
    if (mdContent !== null) return;
    if (story?.rawMarkdown) {
      if (mountedRef.current) setMdContent(story.rawMarkdown);
      return;
    }
    if (!story?.sourceFile) return;
    try {
      const result = await window.electronAPI?.fileRead(story.sourceFile);
      if (result?.content && mountedRef.current) {
        setMdContent(result.content);
      }
    } catch {
      // file read failed — silently ignore, user sees "No markdown content"
    }
  }, [story, mdContent]);

  const handleSaveMarkdown = useCallback(async (content: string) => {
    if (!story?.sourceFile) return;
    const result = await writeMarkdownFile(story.sourceFile, content);
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
  }, [story, showToast, t]);

  useEffect(() => {
    if (!initialized) return;
    const found = getStoryByKey(id || '') || getStory(id || '');
    if (found) {
      setStory(found);
      setMdContent(found.rawMarkdown ?? null);
    } else {
      setNotFound(true);
    }
  }, [id, initialized, getStory, getStoryByKey]);

  if (!initialized) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-tertiary">{t('common.loading')}</p>
      </div>
    );
  }

  if (notFound) {
    return <Navigate to="/board" replace />;
  }

  if (!story) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-tertiary">{t('common.loading')}</p>
      </div>
    );
  }

  const epic = getEpic(story.epicId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-6 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{story.title}</h1>
          <StatusBadge status={story.status} />
        </div>
        <div className="flex items-center gap-4 text-sm text-foreground-secondary">
          <span>{story.key}</span>
          {epic && <span>{t('story.epic')}: {epic.title}</span>}
          {story.assignee && <span>{t('story.assignee')}: {story.assignee}</span>}
          {story.storyPoints !== undefined && <span>{story.storyPoints} SP</span>}
          {story.sourceFile && (
            <button
              onClick={() => openMdModal(story)}
              className="inline-flex items-center gap-1 text-foreground-tertiary hover:text-foreground-primary transition-colors cursor-pointer"
              title={story.sourceFile}
            >
              <FileText size={14} />
              {t('story.hasFile')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <StoryDetailTabs
          story={story}
          rawMarkdown={mdContent}
          onOpenMdModal={() => openMdModal(story, true)}
          onLoadMarkdown={loadMarkdown}
        />
      </div>

      <MarkdownModal
        isOpen={mdModalOpen}
        onClose={() => { setMdModalOpen(false); setMdStartInEdit(false); }}
        title={story.title}
        markdownContent={mdContent}
        filePath={story.sourceFile}
        editable={!!story.sourceFile}
        startInEditMode={mdStartInEdit}
        onSave={handleSaveMarkdown}
      />
    </div>
  );
}
