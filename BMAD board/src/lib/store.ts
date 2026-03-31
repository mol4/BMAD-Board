import {
  Epic,
  Story,
  Task,
  Sprint,
  EpicStatus,
  StoryStatus,
  TaskStatus,
  Priority,
  CreateEpicRequest,
  CreateStoryRequest,
  CreateTaskRequest,
} from './types';
import { v4 as uuidv4 } from 'uuid';

function extractKeyCounter(key: string, prefix: string): number {
  const normalized = key.replace(prefix, '');
  const digits = normalized.match(/\d+/g);
  if (!digits || digits.length === 0) return 0;
  return parseInt(digits.join(''), 10);
}

class Store {
  private epics: Map<string, Epic> = new Map();
  private stories: Map<string, Story> = new Map();
  private tasks: Map<string, Task> = new Map();
  private sprints: Map<string, Sprint> = new Map();
  private counters = { epic: 0, story: 0, task: 0, sprint: 0 };
  private initialized = false;

  getAllEpics(): Epic[] {
    return Array.from(this.epics.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getEpic(id: string): Epic | undefined {
    return this.epics.get(id);
  }

  getEpicByKey(key: string): Epic | undefined {
    return Array.from(this.epics.values()).find((e) => e.key === key);
  }

  createEpic(req: CreateEpicRequest): Epic {
    this.counters.epic++;
    const now = new Date().toISOString();
    const epic: Epic = {
      id: uuidv4(),
      key: `EPIC-${this.counters.epic}`,
      title: req.title,
      description: req.description,
      status: 'draft',
      priority: req.priority || 'medium',
      stories: [],
      labels: req.labels || [],
      createdAt: now,
      updatedAt: now,
    };
    this.epics.set(epic.id, epic);
    return epic;
  }

  updateEpicStatus(id: string, status: EpicStatus): Epic | undefined {
    const epic = this.epics.get(id);
    if (!epic) return undefined;
    epic.status = status;
    epic.updatedAt = new Date().toISOString();
    return epic;
  }

  updateEpic(id: string, updates: Partial<Epic>): Epic | undefined {
    const epic = this.epics.get(id);
    if (!epic) return undefined;
    Object.assign(epic, updates, { updatedAt: new Date().toISOString() });
    return epic;
  }

  deleteEpic(id: string): boolean {
    const epic = this.epics.get(id);
    if (!epic) return false;
    for (const storyId of epic.stories) {
      this.deleteStory(storyId);
    }
    return this.epics.delete(id);
  }

  insertEpic(epic: Epic): void {
    this.epics.set(epic.id, epic);
    const num = extractKeyCounter(epic.key, 'EPIC-');
    if (num > this.counters.epic) this.counters.epic = num;
  }

  getAllStories(): Story[] {
    return Array.from(this.stories.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getStoriesByEpic(epicId: string): Story[] {
    return Array.from(this.stories.values())
      .filter((s) => s.epicId === epicId)
      .sort((a, b) => {
        const order = ['backlog', 'todo', 'in-progress', 'in-review', 'done'];
        return order.indexOf(a.status) - order.indexOf(b.status);
      });
  }

  getStoriesByStatus(status: StoryStatus): Story[] {
    return Array.from(this.stories.values()).filter((s) => s.status === status);
  }

  getStory(id: string): Story | undefined {
    return this.stories.get(id);
  }

  getStoryByKey(key: string): Story | undefined {
    return Array.from(this.stories.values()).find((s) => s.key === key);
  }

  createStory(req: CreateStoryRequest): Story {
    this.counters.story++;
    const now = new Date().toISOString();
    const story: Story = {
      id: uuidv4(),
      key: `STORY-${this.counters.story}`,
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
    this.stories.set(story.id, story);

    const epic = this.epics.get(req.epicId);
    if (epic) {
      epic.stories.push(story.id);
      epic.updatedAt = now;
    }

    return story;
  }

  updateStoryStatus(id: string, status: StoryStatus): Story | undefined {
    const story = this.stories.get(id);
    if (!story) return undefined;
    story.status = status;
    story.updatedAt = new Date().toISOString();
    this.recalculateEpicStatus(story.epicId);
    return story;
  }

  updateStory(id: string, updates: Partial<Story>): Story | undefined {
    const story = this.stories.get(id);
    if (!story) return undefined;
    Object.assign(story, updates, { updatedAt: new Date().toISOString() });
    return story;
  }

  deleteStory(id: string): boolean {
    const story = this.stories.get(id);
    if (!story) return false;
    for (const taskId of story.tasks) {
      this.tasks.delete(taskId);
    }
    const epic = this.epics.get(story.epicId);
    if (epic) {
      epic.stories = epic.stories.filter((sid) => sid !== id);
    }
    return this.stories.delete(id);
  }

  insertStory(story: Story): void {
    this.stories.set(story.id, story);
    const num = extractKeyCounter(story.key, 'STORY-');
    if (num > this.counters.story) this.counters.story = num;
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStory(storyId: string): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.storyId === storyId);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  createTask(req: CreateTaskRequest): Task {
    this.counters.task++;
    const now = new Date().toISOString();
    const task: Task = {
      id: uuidv4(),
      key: `TASK-${this.counters.task}`,
      storyId: req.storyId,
      title: req.title,
      description: req.description,
      status: 'todo',
      priority: req.priority || 'medium',
      assignee: req.assignee,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);

    const story = this.stories.get(req.storyId);
    if (story) {
      story.tasks.push(task.id);
      story.updatedAt = now;
    }

    return task;
  }

  updateTaskStatus(id: string, status: TaskStatus): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    return task;
  }

  deleteTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    const story = this.stories.get(task.storyId);
    if (story) {
      story.tasks = story.tasks.filter((tid) => tid !== id);
    }
    return this.tasks.delete(id);
  }

  getActiveSprint(): Sprint | undefined {
    return Array.from(this.sprints.values()).find((s) => s.status === 'active');
  }

  getAllSprints(): Sprint[] {
    return Array.from(this.sprints.values());
  }

  createSprint(name: string, goal?: string): Sprint {
    this.counters.sprint++;
    const sprint: Sprint = {
      id: uuidv4(),
      name,
      goal,
      status: 'planning',
      storyIds: [],
    };
    this.sprints.set(sprint.id, sprint);
    return sprint;
  }

  private recalculateEpicStatus(epicId: string) {
    const epic = this.epics.get(epicId);
    if (!epic) return;
    const stories = this.getStoriesByEpic(epicId);
    if (stories.length === 0) {
      epic.status = 'draft';
    } else if (stories.every((s) => s.status === 'done')) {
      epic.status = 'done';
    } else if (stories.some((s) => s.status !== 'backlog' && s.status !== 'todo')) {
      epic.status = 'in-progress';
    } else {
      epic.status = 'ready';
    }
    epic.updatedAt = new Date().toISOString();
  }

  recalculateAllEpicStatuses() {
    for (const epic of this.epics.values()) {
      this.recalculateEpicStatus(epic.id);
    }
  }

  getStats() {
    const stories = this.getAllStories();
    return {
      totalEpics: this.epics.size,
      totalStories: this.stories.size,
      totalTasks: this.tasks.size,
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
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  setInitialized(v: boolean) {
    this.initialized = v;
  }

  clear() {
    this.epics.clear();
    this.stories.clear();
    this.tasks.clear();
    this.sprints.clear();
    this.counters = { epic: 0, story: 0, task: 0, sprint: 0 };
    this.initialized = false;
  }
}

const globalStore = globalThis as unknown as { __store?: Store };
if (!globalStore.__store) {
  globalStore.__store = new Store();
}
export const store: Store = globalStore.__store;