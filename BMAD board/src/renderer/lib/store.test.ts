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
});
