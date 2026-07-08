import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncEngine } from './sync-engine';
import { useAppStore } from './store';
import { storeManager } from './store-manager';

const { fileReadMock, refreshActiveProjectMock, configRef } = vi.hoisted(() => {
  return {
    fileReadMock: vi.fn(),
    refreshActiveProjectMock: vi.fn().mockResolvedValue(undefined),
    configRef: { epicsDir: '/test/epics', storiesDir: '/test/stories' },
  };
});

vi.mock('./store-manager', () => ({
  storeManager: {
    refreshActiveProject: refreshActiveProjectMock,
  },
}));

vi.mock('./config', () => ({
  getConfig: () => configRef,
}));

function setupWindowMock() {
  (window as unknown as { electronAPI: { fileRead: typeof fileReadMock } }).electronAPI = {
    fileRead: fileReadMock,
  };
}

function cleanupWindowMock() {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
}

describe('SyncEngine', () => {
  let engine: SyncEngine;

  beforeEach(() => {
    useAppStore.setState({
      epics: [
        {
          id: 'epic-1',
          key: 'EPIC-1',
          title: 'Epic 1',
          description: '',
          status: 'in-progress',
          priority: 'medium',
          stories: [],
          labels: [],
          sourceFile: '/test/epics/epic-1.md',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      stories: [],
      tasks: [],
      sprints: [],
      counters: { epic: 1, story: 0, task: 0, sprint: 0 },
      initialized: true,
    });
    fileReadMock.mockClear();
    refreshActiveProjectMock.mockClear();
    setupWindowMock();
    engine = new SyncEngine();
  });

  afterEach(() => {
    cleanupWindowMock();
  });

  it('processes a single modified story file and upserts the story', async () => {
    const storyContent = `---
id: 1.2
status: in-progress
---
# Story 1.2: Test Story

Description here.

**Acceptance Criteria**
- AC1
`;
    fileReadMock.mockResolvedValue({ content: storyContent, exists: true });

    await engine.processChanges([{ path: '/test/stories/1-2-test-story.md', type: 'modified', mtimeMs: 1 }]);

    const stories = useAppStore.getState().stories;
    expect(stories.length).toBe(1);
    expect(stories[0].key).toBe('STORY-1.2');
    expect(stories[0].title).toBe('Story 1.2: Test Story');
    expect(stories[0].status).toBe('in-progress');
  });

  it('processes a deleted file and removes the story', async () => {
    useAppStore.setState({
      stories: [
        {
          id: 'story-1',
          key: 'STORY-1.1',
          epicId: 'epic-1',
          title: 'Old Story',
          description: '',
          acceptanceCriteria: [],
          status: 'backlog',
          priority: 'medium',
          tasks: [],
          labels: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceFile: '/test/stories/1-1-old-story.md',
        },
      ],
    });

    await engine.processChanges([{ path: '/test/stories/1-1-old-story.md', type: 'deleted', mtimeMs: 1 }]);

    const stories = useAppStore.getState().stories;
    expect(stories.length).toBe(0);
  });

  it('processes a batch of mixed epic and story changes', async () => {
    const epicContent = `---
id: 1
status: in-progress
---
# Epic 1: Test Epic

Description.
`;
    const storyContent = `---
id: 1.1
status: done
---
# Story 1.1: Test Story

Description.

**Acceptance Criteria**
- AC1
`;
    fileReadMock.mockImplementation((path: string) => {
      if (path.includes('epic')) return Promise.resolve({ content: epicContent, exists: true });
      return Promise.resolve({ content: storyContent, exists: true });
    });

    await engine.processChanges([
      { path: '/test/epics/epic-1.md', type: 'modified', mtimeMs: 1 },
      { path: '/test/stories/1-1-test-story.md', type: 'modified', mtimeMs: 2 },
    ]);

    const epics = useAppStore.getState().epics;
    const stories = useAppStore.getState().stories;
    expect(epics.length).toBe(1);
    expect(stories.length).toBe(1);
    expect(epics[0].key).toBe('EPIC-1');
    expect(stories[0].key).toBe('STORY-1.1');
  });

  it('skips a parse failure and continues processing the batch', async () => {
    const invalidContent = 'not valid markdown frontmatter';
    const validContent = `---
id: 1.1
status: todo
---
# Story 1.1: Valid Story

Description.

**Acceptance Criteria**
- AC1
`;
    fileReadMock.mockImplementation((path: string) => {
      if (path.includes('invalid')) return Promise.resolve({ content: invalidContent, exists: true });
      return Promise.resolve({ content: validContent, exists: true });
    });

    await engine.processChanges([
      { path: '/test/stories/1-invalid.md', type: 'modified', mtimeMs: 1 },
      { path: '/test/stories/1-1-valid.md', type: 'modified', mtimeMs: 2 },
    ]);

    const stories = useAppStore.getState().stories;
    expect(stories.length).toBe(1);
    expect(stories[0].key).toBe('STORY-1.1');
  });

  it('forceFullSync delegates to storeManager.refreshActiveProject', async () => {
    await engine.forceFullSync();
    expect(refreshActiveProjectMock).toHaveBeenCalled();
  });

  it('emits start and complete events during processChanges', async () => {
    const startMock = vi.fn();
    const completeMock = vi.fn();
    engine.addEventListener('start', startMock);
    engine.addEventListener('complete', completeMock);

    const storyContent = `---
id: 1.1
---
# Story 1.1: Test

**Acceptance Criteria**
- AC1
`;
    fileReadMock.mockResolvedValue({ content: storyContent, exists: true });

    await engine.processChanges([{ path: '/test/stories/1-1-test.md', type: 'modified', mtimeMs: 1 }]);

    expect(startMock).toHaveBeenCalled();
    expect(completeMock).toHaveBeenCalled();
  });

  it('prevents overlapping sync operations', async () => {
    const storyContent = `---
id: 1.1
---
# Story 1.1: Test

**Acceptance Criteria**
- AC1
`;
    fileReadMock.mockResolvedValue({ content: storyContent, exists: true });

    const p1 = engine.processChanges([{ path: '/test/stories/1-1-test.md', type: 'modified', mtimeMs: 1 }]);
    const p2 = engine.processChanges([{ path: '/test/stories/1-1-test.md', type: 'modified', mtimeMs: 2 }]);

    await Promise.all([p1, p2]);

    // Only one file read should happen because the second call is skipped
    expect(fileReadMock).toHaveBeenCalledTimes(1);
  });

  it('skips non-artifact files', async () => {
    await engine.processChanges([{ path: '/test/other/random.txt', type: 'modified', mtimeMs: 1 }]);
    expect(fileReadMock).not.toHaveBeenCalled();
  });

  it('does not treat directory paths as artifact files', async () => {
    await engine.processChanges([
      { path: '/test/epics/', type: 'modified', mtimeMs: 1 },
      { path: '/test/stories\\', type: 'modified', mtimeMs: 2 },
    ]);
    expect(fileReadMock).not.toHaveBeenCalled();
  });

  it('emits error listener when parsing fails', async () => {
    const errorMock = vi.fn();
    engine.addErrorListener(errorMock);
    fileReadMock.mockResolvedValue({ content: 'not valid frontmatter', exists: true });

    await engine.processChanges([{ path: '/test/stories/1-bad.md', type: 'modified', mtimeMs: 1 }]);

    expect(errorMock).toHaveBeenCalled();
    expect(errorMock.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('matches deleted files when sourceFile uses Windows backslashes', async () => {
    useAppStore.setState({
      stories: [
        {
          id: 'story-1',
          key: 'STORY-1.1',
          epicId: 'epic-1',
          title: 'Old Story',
          description: '',
          acceptanceCriteria: [],
          status: 'backlog',
          priority: 'medium',
          tasks: [],
          labels: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceFile: '\\test\\stories\\1-1-old-story.md',
        },
      ],
    });

    await engine.processChanges([{ path: '/test/stories/1-1-old-story.md', type: 'deleted', mtimeMs: 1 }]);

    expect(useAppStore.getState().stories.length).toBe(0);
  });

  it('guards against empty epicsDir/storiesDir config', async () => {
    configRef.epicsDir = '';
    configRef.storiesDir = '';

    await engine.processChanges([{ path: '/test/epics/epic-1.md', type: 'modified', mtimeMs: 1 }]);

    expect(fileReadMock).not.toHaveBeenCalled();

    configRef.epicsDir = '/test/epics';
    configRef.storiesDir = '/test/stories';
  });
});
