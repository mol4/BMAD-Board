import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './store';
import type { Epic, Story } from '@/lib/types';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().clear();
  });

  it('initializes with default values', () => {
    const state = useAppStore.getState();
    expect(state.activeProjectId).toBeNull();
    expect(state.epics).toEqual([]);
    expect(state.stories).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.sprints).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.initialized).toBe(false);
  });

  it('setActiveProject updates activeProjectId', () => {
    useAppStore.getState().setActiveProject('project-1');
    expect(useAppStore.getState().activeProjectId).toBe('project-1');
  });

  it('createEpic adds epic to store', () => {
    const epic = useAppStore.getState().createEpic({
      title: 'Test Epic',
      description: 'Test description',
      priority: 'high',
    });
    expect(epic.key).toBe('EPIC-1');
    expect(epic.title).toBe('Test Epic');
    expect(useAppStore.getState().epics).toHaveLength(1);
  });

  it('createStory adds story and links to epic', () => {
    const epic = useAppStore.getState().createEpic({ title: 'Test Epic', description: '' });
    const story = useAppStore.getState().createStory({
      epicId: epic.id,
      title: 'Test Story',
      description: 'Test description',
    });
    expect(story.key).toBe('STORY-1');
    expect(useAppStore.getState().stories).toHaveLength(1);
    const updatedEpic = useAppStore.getState().getEpic(epic.id);
    expect(updatedEpic?.stories).toContain(story.id);
  });

  it('updateStoryStatus recalculates epic status', () => {
    const epic = useAppStore.getState().createEpic({ title: 'Test Epic', description: '' });
    const story = useAppStore.getState().createStory({
      epicId: epic.id,
      title: 'Test Story',
      description: '',
    });
    useAppStore.getState().updateStoryStatus(story.id, 'done');
    const updatedEpic = useAppStore.getState().getEpic(epic.id);
    expect(updatedEpic?.status).toBe('done');
  });

  it('getStats returns correct counts', () => {
    useAppStore.getState().createEpic({ title: 'Epic 1', description: '' });
    useAppStore.getState().createEpic({ title: 'Epic 2', description: '' });
    const stats = useAppStore.getState().getStats();
    expect(stats.totalEpics).toBe(2);
    expect(stats.totalStories).toBe(0);
  });

  it('clear resets all state', () => {
    useAppStore.getState().createEpic({ title: 'Test', description: '' });
    useAppStore.getState().setInitialized(true);
    useAppStore.getState().clear();
    const state = useAppStore.getState();
    expect(state.epics).toEqual([]);
    expect(state.initialized).toBe(false);
    expect(state.counters.epic).toBe(0);
  });

  it('setLoading updates loading state', () => {
    useAppStore.getState().setLoading(true);
    expect(useAppStore.getState().loading).toBe(true);
    useAppStore.getState().setLoading(false);
    expect(useAppStore.getState().loading).toBe(false);
  });

  it('setError updates error state', () => {
    useAppStore.getState().setError('Test error');
    expect(useAppStore.getState().error).toBe('Test error');
    useAppStore.getState().setError(null);
    expect(useAppStore.getState().error).toBeNull();
  });

  it('upsertEpic adds new epic', () => {
    const epic: Epic = {
      id: 'epic-1',
      key: 'EPIC-1',
      title: 'Upserted Epic',
      description: '',
      status: 'draft',
      priority: 'medium',
      stories: [],
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAppStore.getState().upsertEpic(epic);
    expect(useAppStore.getState().epics).toHaveLength(1);
    expect(useAppStore.getState().epics[0].title).toBe('Upserted Epic');
  });

  it('upsertEpic updates existing epic by id', () => {
    const epic: Epic = {
      id: 'epic-1',
      key: 'EPIC-1',
      title: 'Original',
      description: '',
      status: 'draft',
      priority: 'medium',
      stories: [],
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAppStore.getState().upsertEpic(epic);
    const updated: Epic = { ...epic, title: 'Updated' };
    useAppStore.getState().upsertEpic(updated);
    expect(useAppStore.getState().epics).toHaveLength(1);
    expect(useAppStore.getState().epics[0].title).toBe('Updated');
  });

  it('removeEpic deletes epic by id', () => {
    const epic: Epic = {
      id: 'epic-1',
      key: 'EPIC-1',
      title: 'To Remove',
      description: '',
      status: 'draft',
      priority: 'medium',
      stories: [],
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAppStore.getState().upsertEpic(epic);
    useAppStore.getState().removeEpic('epic-1');
    expect(useAppStore.getState().epics).toHaveLength(0);
  });

  it('upsertStory adds new story', () => {
    const story: Story = {
      id: 'story-1',
      key: 'STORY-1.1',
      epicId: 'epic-1',
      title: 'Upserted Story',
      description: '',
      acceptanceCriteria: [],
      status: 'backlog',
      priority: 'medium',
      tasks: [],
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAppStore.getState().upsertStory(story);
    expect(useAppStore.getState().stories).toHaveLength(1);
    expect(useAppStore.getState().stories[0].title).toBe('Upserted Story');
  });

  it('upsertStory updates existing story by id', () => {
    const story: Story = {
      id: 'story-1',
      key: 'STORY-1.1',
      epicId: 'epic-1',
      title: 'Original',
      description: '',
      acceptanceCriteria: [],
      status: 'backlog',
      priority: 'medium',
      tasks: [],
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    useAppStore.getState().upsertStory(story);
    const updated: Story = { ...story, title: 'Updated' };
    useAppStore.getState().upsertStory(updated);
    expect(useAppStore.getState().stories).toHaveLength(1);
    expect(useAppStore.getState().stories[0].title).toBe('Updated');
  });

  it('upsertStory removes stale reference when moving story to a different epic', () => {
    const epic1 = useAppStore.getState().createEpic({ title: 'Epic 1', description: '' });
    const epic2 = useAppStore.getState().createEpic({ title: 'Epic 2', description: '' });
    const story = useAppStore.getState().createStory({ epicId: epic1.id, title: 'Movable Story', description: '' });

    useAppStore.getState().upsertStory({ ...story, epicId: epic2.id });

    const updatedEpic1 = useAppStore.getState().getEpic(epic1.id);
    const updatedEpic2 = useAppStore.getState().getEpic(epic2.id);
    expect(updatedEpic1?.stories).not.toContain(story.id);
    expect(updatedEpic2?.stories).toContain(story.id);
    expect(useAppStore.getState().stories[0].epicId).toBe(epic2.id);
  });

  it('removeStory deletes story by id and recalculates epic status', () => {
    const epic = useAppStore.getState().createEpic({ title: 'Parent Epic', description: '' });
    const story = useAppStore.getState().createStory({ epicId: epic.id, title: 'To Remove', description: '' });
    useAppStore.getState().updateStoryStatus(story.id, 'in-progress');

    useAppStore.getState().removeStory(story.id);
    expect(useAppStore.getState().stories).toHaveLength(0);
    const updatedEpic = useAppStore.getState().getEpic(epic.id);
    expect(updatedEpic?.status).toBe('draft');
    expect(updatedEpic?.stories).not.toContain(story.id);
  });
});
