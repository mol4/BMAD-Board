import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './store';
import type { Epic, Story } from '@/lib/types';

const mockEpics: Epic[] = [
  {
    id: 'epic-1',
    key: 'EPIC-1',
    title: 'Test Epic',
    description: 'Test epic description',
    status: 'draft',
    priority: 'medium',
    stories: [],
    labels: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockStories: Story[] = [
  {
    id: 'story-1',
    key: 'STORY-1',
    epicId: 'epic-1',
    title: 'Test Story',
    description: 'Test story description',
    acceptanceCriteria: [],
    status: 'backlog',
    priority: 'high',
    tasks: [],
    labels: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeProjectId: null,
      epics: [],
      stories: [],
      loading: false,
      error: null,
    });
  });

  it('initializes with default values', () => {
    const state = useAppStore.getState();
    expect(state.activeProjectId).toBeNull();
    expect(state.epics).toEqual([]);
    expect(state.stories).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setActiveProject updates activeProjectId', () => {
    useAppStore.getState().setActiveProject('project-1');
    expect(useAppStore.getState().activeProjectId).toBe('project-1');
  });

  it('setEpics updates epics array', () => {
    useAppStore.getState().setEpics(mockEpics);
    expect(useAppStore.getState().epics).toEqual(mockEpics);
  });

  it('setStories updates stories array', () => {
    useAppStore.getState().setStories(mockStories);
    expect(useAppStore.getState().stories).toEqual(mockStories);
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
