
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type StoryStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';
export type EpicStatus = 'draft' | 'ready' | 'in-progress' | 'done';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type IssueType = 'epic' | 'story' | 'task' | 'bug';

export interface Epic {
  id: string;
  key: string; // e.g., "EPIC-1"
  title: string;
  description: string;
  status: EpicStatus;
  priority: Priority;
  stories: string[]; // story IDs
  labels: string[];
  createdAt: string;
  updatedAt: string;
  sourceFile?: string; // path to the .md file
  rawMarkdown?: string;
}

export interface Story {
  id: string;
  key: string; // e.g., "STORY-1"
  epicId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: StoryStatus;
  priority: Priority;
  storyPoints?: number;
  assignee?: string;
  tasks: string[]; // task IDs
  labels: string[];
  createdAt: string;
  updatedAt: string;
  sourceFile?: string;
  rawMarkdown?: string;
}

export interface Task {
  id: string;
  key: string; // e.g., "TASK-1"
  storyId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed';
  storyIds: string[];
}

export interface BoardColumn {
  id: StoryStatus;
  title: string;
  stories: Story[];
}

export interface CreateEpicRequest {
  title: string;
  description: string;
  priority?: Priority;
  labels?: string[];
}

export interface CreateStoryRequest {
  epicId: string;
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  priority?: Priority;
  storyPoints?: number;
  assignee?: string;
  labels?: string[];
}

export interface CreateTaskRequest {
  storyId: string;
  title: string;
  description: string;
  priority?: Priority;
  assignee?: string;
}

export interface UpdateStatusRequest {
  status: string;
}

export interface EpicFrontmatter {
  id?: string;
  title: string;
  status?: EpicStatus;
  priority?: Priority;
  labels?: string[];
}

export interface StoryFrontmatter {
  id?: string;
  title: string;
  epicId?: string;
  status?: StoryStatus;
  priority?: Priority;
  storyPoints?: number;
  assignee?: string;
  labels?: string[];
}