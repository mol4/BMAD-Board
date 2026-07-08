import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Epic, Story, Task, Sprint,
  EpicStatus, StoryStatus, TaskStatus,
  CreateEpicRequest, CreateStoryRequest, CreateTaskRequest,
} from '@/lib/types';

function extractKeyCounter(key: string, prefix: string): number {
  const normalized = key.replace(prefix, '');
  const digits = normalized.match(/\d+/g);
  if (!digits || digits.length === 0) return 0;
  return parseInt(digits[0], 10);
}

function recalculateEpicStatus(epic: Epic, stories: Story[]): EpicStatus {
  const epicStories = stories.filter((s) => s.epicId === epic.id);
  if (epicStories.length === 0) return 'draft';
  if (epicStories.every((s) => s.status === 'done')) return 'done';
  if (epicStories.some((s) => s.status !== 'backlog' && s.status !== 'todo')) return 'in-progress';
  if (epicStories.every((s) => s.status === 'backlog')) return 'draft';
  return 'ready';
}

interface AppState {
  activeProjectId: string | null;
  epics: Epic[];
  stories: Story[];
  tasks: Task[];
  sprints: Sprint[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  counters: { epic: number; story: number; task: number; sprint: number };
  setActiveProject: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (v: boolean) => void;
  clear: () => void;
  insertEpic: (epic: Epic) => void;
  insertStory: (story: Story) => void;
  getAllEpics: () => Epic[];
  getEpic: (id: string) => Epic | undefined;
  getEpicByKey: (key: string) => Epic | undefined;
  createEpic: (req: CreateEpicRequest) => Epic;
  updateEpicStatus: (id: string, status: EpicStatus) => void;
  updateEpic: (id: string, updates: Partial<Epic>) => void;
  deleteEpic: (id: string) => boolean;
  getAllStories: () => Story[];
  getStoriesByEpic: (epicId: string) => Story[];
  getStoriesByStatus: (status: StoryStatus) => Story[];
  getStory: (id: string) => Story | undefined;
  getStoryByKey: (key: string) => Story | undefined;
  createStory: (req: CreateStoryRequest) => Story;
  updateStoryStatus: (id: string, status: StoryStatus) => void;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => boolean;
  getAllTasks: () => Task[];
  getTasksByStory: (storyId: string) => Task[];
  getTask: (id: string) => Task | undefined;
  createTask: (req: CreateTaskRequest) => Task;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => boolean;
  getActiveSprint: () => Sprint | undefined;
  getAllSprints: () => Sprint[];
  createSprint: (name: string, goal?: string) => Sprint;
  upsertEpic: (epic: Epic) => void;
  removeEpic: (id: string) => void;
  upsertStory: (story: Story) => void;
  removeStory: (id: string) => void;
  recalculateAllEpicStatuses: () => void;
  getStats: () => {
    totalEpics: number;
    totalStories: number;
    totalTasks: number;
    storiesByStatus: Record<string, number>;
    totalStoryPoints: number;
    completedStoryPoints: number;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  activeProjectId: null,
  epics: [],
  stories: [],
  tasks: [],
  sprints: [],
  loading: false,
  error: null,
  initialized: false,
  counters: { epic: 0, story: 0, task: 0, sprint: 0 },

  setActiveProject: (id) => set({ activeProjectId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (v) => set({ initialized: v }),

  clear: () => set({
    epics: [], stories: [], tasks: [], sprints: [],
    counters: { epic: 0, story: 0, task: 0, sprint: 0 },
    initialized: false,
  }),

  insertEpic: (epic) => set((state) => {
    const num = extractKeyCounter(epic.key, 'EPIC-');
    return {
      epics: [...state.epics, epic],
      counters: { ...state.counters, epic: Math.max(state.counters.epic, num) },
    };
  }),

  insertStory: (story) => set((state) => {
    const num = extractKeyCounter(story.key, 'STORY-');
    return {
      stories: [...state.stories, story],
      counters: { ...state.counters, story: Math.max(state.counters.story, num) },
    };
  }),

  getAllEpics: () => {
    const { epics } = get();
    return [...epics].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getEpic: (id) => get().epics.find((e) => e.id === id),

  getEpicByKey: (key) => get().epics.find((e) => e.key === key),

  createEpic: (req) => {
    let created: Epic | null = null;
    set((state) => {
      const counter = state.counters.epic + 1;
      const now = new Date().toISOString();
      const epic: Epic = {
        id: uuidv4(),
        key: `EPIC-${counter}`,
        title: req.title,
        description: req.description,
        status: 'draft',
        priority: req.priority || 'medium',
        stories: [],
        labels: req.labels || [],
        createdAt: now,
        updatedAt: now,
      };
      created = epic;
      return {
        epics: [...state.epics, epic],
        counters: { ...state.counters, epic: counter },
      };
    });
    return created!;
  },

  updateEpicStatus: (id, status) => set((state) => ({
    epics: state.epics.map((e) =>
      e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e
    ),
  })),

  updateEpic: (id, updates) => set((state) => ({
    epics: state.epics.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    ),
  })),

  deleteEpic: (id) => {
    const epic = get().epics.find((e) => e.id === id);
    if (!epic) return false;
    set((state) => ({
      stories: state.stories.filter((s) => !epic.stories.includes(s.id)),
      tasks: state.tasks.filter((t) => !epic.stories.some((sid) =>
        state.stories.find((s) => s.id === sid)?.tasks.includes(t.id)
      )),
      epics: state.epics.filter((e) => e.id !== id),
    }));
    return true;
  },

  getAllStories: () => {
    const { stories } = get();
    return [...stories].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getStoriesByEpic: (epicId) => {
    const { stories } = get();
    const order = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];
    return stories
      .filter((s) => s.epicId === epicId)
      .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  },

  getStoriesByStatus: (status) => get().stories.filter((s) => s.status === status),

  getStory: (id) => get().stories.find((s) => s.id === id),

  getStoryByKey: (key) => get().stories.find((s) => s.key === key),

  createStory: (req) => {
    let created: Story | null = null;
    set((state) => {
      const counter = state.counters.story + 1;
      const now = new Date().toISOString();
      const story: Story = {
        id: uuidv4(),
        key: `STORY-${counter}`,
        epicId: req.epicId,
        title: req.title,
        description: req.description,
        acceptanceCriteria: req.acceptanceCriteria || [],
        status: 'backlog',
        priority: req.priority || 'medium',
        storyPoints: req.storyPoints,
        assignee: req.assignee,
        tasks: [],
        labels: req.labels || [],
        createdAt: now,
        updatedAt: now,
      };
      created = story;
      return {
        stories: [...state.stories, story],
        epics: state.epics.map((e) =>
          e.id === req.epicId
            ? { ...e, stories: [...e.stories, story.id], updatedAt: now }
            : e
        ),
        counters: { ...state.counters, story: counter },
      };
    });
    return created!;
  },

  updateStoryStatus: (id, status) => set((state) => {
    const story = state.stories.find((s) => s.id === id);
    if (!story) return state;
    const updatedStories = state.stories.map((s) =>
      s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s
    );
    const updatedEpics = state.epics.map((e) =>
      e.id === story.epicId
        ? { ...e, status: recalculateEpicStatus(e, updatedStories), updatedAt: new Date().toISOString() }
        : e
    );
    return { stories: updatedStories, epics: updatedEpics };
  }),

  updateStory: (id, updates) => set((state) => ({
    stories: state.stories.map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    ),
  })),

  deleteStory: (id) => {
    const story = get().stories.find((s) => s.id === id);
    if (!story) return false;
    set((state) => ({
      tasks: state.tasks.filter((t) => !story.tasks.includes(t.id)),
      stories: state.stories.filter((s) => s.id !== id),
      epics: state.epics.map((e) =>
        e.id === story.epicId
          ? { ...e, stories: e.stories.filter((sid) => sid !== id), updatedAt: new Date().toISOString() }
          : e
      ),
    }));
    return true;
  },

  getAllTasks: () => get().tasks,

  getTasksByStory: (storyId) => get().tasks.filter((t) => t.storyId === storyId),

  getTask: (id) => get().tasks.find((t) => t.id === id),

  createTask: (req) => {
    let created: Task | null = null;
    set((state) => {
      const counter = state.counters.task + 1;
      const now = new Date().toISOString();
      const task: Task = {
        id: uuidv4(),
        key: `TASK-${counter}`,
        storyId: req.storyId,
        title: req.title,
        description: req.description,
        status: 'todo',
        priority: req.priority || 'medium',
        assignee: req.assignee,
        createdAt: now,
        updatedAt: now,
      };
      created = task;
      return {
        tasks: [...state.tasks, task],
        stories: state.stories.map((s) =>
          s.id === req.storyId
            ? { ...s, tasks: [...s.tasks, task.id], updatedAt: now }
            : s
        ),
        counters: { ...state.counters, task: counter },
      };
    });
    return created!;
  },

  updateTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
    ),
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ),
  })),

  deleteTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return false;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      stories: state.stories.map((s) =>
        s.id === task.storyId
          ? { ...s, tasks: s.tasks.filter((tid) => tid !== id), updatedAt: new Date().toISOString() }
          : s
      ),
    }));
    return true;
  },

  getActiveSprint: () => get().sprints.find((s) => s.status === 'active'),

  getAllSprints: () => get().sprints,

  createSprint: (name, goal) => {
    let created: Sprint | null = null;
    set((state) => {
      const counter = state.counters.sprint + 1;
      const sprint: Sprint = {
        id: uuidv4(),
        name,
        goal,
        status: 'planning',
        storyIds: [],
      };
      created = sprint;
      return {
        sprints: [...state.sprints, sprint],
        counters: { ...state.counters, sprint: counter },
      };
    });
    return created!;
  },

  upsertEpic: (epic) => set((state) => {
    const existing = state.epics.find((e) => e.id === epic.id);
    const epics = existing
      ? state.epics.map((e) => (e.id === epic.id ? { ...epic, updatedAt: new Date().toISOString() } : e))
      : [...state.epics, epic];
    const epicNum = parseInt(epic.key.replace('EPIC-', ''), 10);
    const counters = !existing && epicNum > state.counters.epic
      ? { ...state.counters, epic: epicNum }
      : state.counters;
    return { epics, counters };
  }),

  removeEpic: (id) => set((state) => {
    const epic = state.epics.find((e) => e.id === id);
    if (!epic) return state;
    const removedStoryIds = epic.stories;
    return {
      epics: state.epics.filter((e) => e.id !== id),
      stories: state.stories.filter((s) => !removedStoryIds.includes(s.id)),
      tasks: state.tasks.filter((t) => !removedStoryIds.some((sid) =>
        state.stories.find((s) => s.id === sid)?.tasks.includes(t.id)
      )),
    };
  }),

  upsertStory: (story) => set((state) => {
    const existing = state.stories.find((s) => s.id === story.id);
    const stories = existing
      ? state.stories.map((s) => (s.id === story.id ? { ...story, updatedAt: new Date().toISOString() } : s))
      : [...state.stories, story];
    const oldEpicId = existing?.epicId;
    const epicChanged = oldEpicId !== undefined && oldEpicId !== story.epicId;
    const epics = state.epics.map((e) => {
      if (epicChanged && e.id === oldEpicId) {
        return {
          ...e,
          stories: e.stories.filter((sid) => sid !== story.id),
          status: recalculateEpicStatus(e, stories),
          updatedAt: new Date().toISOString(),
        };
      }
      if (e.id !== story.epicId) return e;
      const alreadyLinked = e.stories.includes(story.id);
      return {
        ...e,
        stories: alreadyLinked ? e.stories : [...e.stories, story.id],
        status: recalculateEpicStatus(e, stories),
        updatedAt: new Date().toISOString(),
      };
    });
    const storyNum = parseFloat(story.key.replace('STORY-', ''));
    const counters = !existing && storyNum > state.counters.story
      ? { ...state.counters, story: storyNum }
      : state.counters;
    return { stories, epics, counters };
  }),

  removeStory: (id) => set((state) => {
    const story = state.stories.find((s) => s.id === id);
    const stories = state.stories.filter((s) => s.id !== id);
    const tasks = story
      ? state.tasks.filter((t) => !story.tasks.includes(t.id))
      : state.tasks;
    const epics = story
      ? state.epics.map((e) =>
          e.id === story.epicId
            ? { ...e, stories: e.stories.filter((sid) => sid !== id), status: recalculateEpicStatus(e, stories), updatedAt: new Date().toISOString() }
            : e
        )
      : state.epics;
    return { stories, tasks, epics };
  }),

  recalculateAllEpicStatuses: () => set((state) => {
    const { stories } = state;
    return {
      epics: state.epics.map((e) => ({
        ...e,
        status: recalculateEpicStatus(e, stories),
        updatedAt: new Date().toISOString(),
      })),
    };
  }),

  getStats: () => {
    const { stories, epics, tasks } = get();
    return {
      totalEpics: epics.length,
      totalStories: stories.length,
      totalTasks: tasks.length,
      storiesByStatus: {
        backlog: stories.filter((s) => s.status === 'backlog').length,
        todo: stories.filter((s) => s.status === 'todo').length,
        'in-progress': stories.filter((s) => s.status === 'in-progress').length,
        'in-review': stories.filter((s) => s.status === 'in-review').length,
        done: stories.filter((s) => s.status === 'done').length,
      },
      totalStoryPoints: stories.reduce((acc, s) => acc + (s.storyPoints || 0), 0),
      completedStoryPoints: stories
        .filter((s) => s.status === 'done')
        .reduce((acc, s) => acc + (s.storyPoints || 0), 0),
    };
  },
}));
