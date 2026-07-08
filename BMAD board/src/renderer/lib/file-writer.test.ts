import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeStoryStatus, writeEpicStatus } from './file-writer';
import type { Story, Epic } from '@/lib/types';

const { fileReadMock, fileWriteMock, updateSprintStatusMock } = vi.hoisted(() => ({
  fileReadMock: vi.fn(),
  fileWriteMock: vi.fn(),
  updateSprintStatusMock: vi.fn(),
}));

vi.mock('@/lib/sync-engine', () => ({
  syncEngine: {
    forceFullSync: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('./sprint-status-sync', () => ({
  updateSprintStatus: updateSprintStatusMock,
}));

function setupWindowMock() {
  (window as unknown as { electronAPI: { fileRead: typeof fileReadMock; fileWrite: typeof fileWriteMock } }).electronAPI = {
    fileRead: fileReadMock,
    fileWrite: fileWriteMock,
  };
}

function cleanupWindowMock() {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
}

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'story-1',
    key: 'STORY-4.1',
    epicId: 'epic-1',
    title: 'Test Story',
    description: '',
    acceptanceCriteria: [],
    status: 'backlog',
    priority: 'medium',
    storyPoints: undefined,
    assignee: undefined,
    tasks: [],
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceFile: '/test/stories/story.md',
    rawMarkdown: '---\nstatus: backlog\n---\n\n# Story 4.1\n\nContent here.\n',
    ...overrides,
  };
}

function makeEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: 'epic-1',
    key: 'EPIC-4',
    title: 'Test Epic',
    description: '',
    status: 'draft',
    priority: 'medium',
    stories: [],
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceFile: '/test/epics/epic.md',
    rawMarkdown: '---\nstatus: draft\n---\n\n# Epic 4\n\nContent.\n',
    ...overrides,
  };
}

describe('file-writer', () => {
  beforeEach(() => {
    fileReadMock.mockClear();
    fileWriteMock.mockClear();
    updateSprintStatusMock.mockClear();
    updateSprintStatusMock.mockResolvedValue(true);
    setupWindowMock();
  });

  afterEach(() => {
    cleanupWindowMock();
  });

  describe('writeStoryStatus', () => {
    it('updates status in frontmatter and writes to file', async () => {
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const story = makeStory();
      const result = await writeStoryStatus(story, 'in-progress');

      expect(result.ok).toBe(true);
      expect(fileWriteMock).toHaveBeenCalledTimes(1);

      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.path).toBe('/test/stories/story.md');
      expect(writeCall.content).toContain('status: in-progress');
      expect(writeCall.content).toContain('# Story 4.1');
      expect(writeCall.content).toContain('Content here.');
    });

    it('preserves body content after frontmatter update', async () => {
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const story = makeStory({
        rawMarkdown: '---\ntitle: Test\nstatus: backlog\n---\n\n# Content\n\nSome body text.\n',
      });
      const result = await writeStoryStatus(story, 'done');

      expect(result.ok).toBe(true);
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('status: done');
      expect(writeCall.content).toContain('# Content');
      expect(writeCall.content).toContain('Some body text.');
    });

    it('returns FILE_LOCKED error when write is rejected', async () => {
      const err = new Error('Locked') as Error & { code: string };
      err.code = 'FILE_LOCKED';
      fileWriteMock.mockRejectedValue(err);

      const story = makeStory();
      const result = await writeStoryStatus(story, 'in-progress');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('FILE_LOCKED');
      }
    });

    it('returns FILE_CHANGED error when mtime mismatch', async () => {
      const err = new Error('Changed') as Error & { code: string };
      err.code = 'FILE_CHANGED';
      fileWriteMock.mockRejectedValue(err);

      const story = makeStory();
      const result = await writeStoryStatus(story, 'in-progress');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('FILE_CHANGED');
      }
    });

    it('syncs sprint-status.yaml for inline story (no sourceFile) using story.key prefix', async () => {
      updateSprintStatusMock.mockResolvedValue(true);

      const story = makeStory({
        key: 'STORY-4.2',
        sourceFile: undefined,
        rawMarkdown: undefined,
      });
      const result = await writeStoryStatus(story, 'done');

      expect(result.ok).toBe(true);
      await vi.waitFor(() =>
        expect(updateSprintStatusMock).toHaveBeenCalledWith('4-2-', 'done'),
      );
      expect(fileWriteMock).not.toHaveBeenCalled();
    });

    it('returns error when sourceFile is missing and story.key is unparseable', async () => {
      const story = makeStory({
        key: 'UNPARSEABLE',
        sourceFile: undefined,
        rawMarkdown: undefined,
      });
      const result = await writeStoryStatus(story, 'done');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('FILE_WRITE_ERROR');
      }
    });

    it('reads file via IPC when rawMarkdown is missing', async () => {
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });
      fileReadMock.mockResolvedValue({
        content: '---\nstatus: backlog\n---\n\n# Story from disk\n',
        exists: true,
      });

      const story = makeStory({ rawMarkdown: undefined });
      const result = await writeStoryStatus(story, 'done');

      expect(result.ok).toBe(true);
      expect(fileReadMock).toHaveBeenCalledWith('/test/stories/story.md');
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('status: done');
    });

    it('preserves updatedAt when present in frontmatter', async () => {
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const story = makeStory({
        rawMarkdown: '---\nstatus: backlog\nupdatedAt: 2026-01-01T00:00:00.000Z\n---\n\nBody\n',
      });
      const result = await writeStoryStatus(story, 'todo');

      expect(result.ok).toBe(true);
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('updatedAt:');
      expect(writeCall.content).toContain('status: todo');
    });

    it('calls updateSprintStatus with source file basename, not story key', async () => {
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });
      updateSprintStatusMock.mockResolvedValue(true);

      const story = makeStory({
        key: 'STORY-4.2',
        sourceFile: '/test/stories/4-2-implement-manual-edit-warning-and-markdown-editor.md',
      });
      const result = await writeStoryStatus(story, 'done');

      expect(result.ok).toBe(true);
      await vi.waitFor(() =>
        expect(updateSprintStatusMock).toHaveBeenCalledWith(
          '4-2-implement-manual-edit-warning-and-markdown-editor',
          'done',
        ),
      );
    });

    it('does not call updateSprintStatus when write fails', async () => {
      const err = new Error('Locked') as Error & { code: string };
      err.code = 'FILE_LOCKED';
      fileWriteMock.mockRejectedValue(err);

      const story = makeStory();
      const result = await writeStoryStatus(story, 'in-progress');

      expect(result.ok).toBe(false);
      expect(updateSprintStatusMock).not.toHaveBeenCalled();
    });

    it('logs warning when updateSprintStatus returns false', async () => {
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });
      updateSprintStatusMock.mockResolvedValue(false);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const story = makeStory();
      const result = await writeStoryStatus(story, 'in-progress');

      expect(result.ok).toBe(true);
      await vi.waitFor(() =>
        expect(warnSpy).toHaveBeenCalledWith(
          '[file-writer] Sprint status sync returned false (non-blocking)',
        ),
      );

      warnSpy.mockRestore();
    });
  });

  describe('writeEpicStatus', () => {
    it('updates epic status in frontmatter', async () => {
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const epic = makeEpic();
      const result = await writeEpicStatus(epic, 'in-progress');

      expect(result.ok).toBe(true);
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('status: in-progress');
      expect(writeCall.content).toContain('# Epic 4');
    });
  });
});
