export interface AppConfig {
  epicsDir: string;
  storiesDir: string;
  lastProjectId: string | null;
}

export interface Project {
  id: string;
  name: string;
  epicsDir: string;
  storiesDir: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export type NewProject = Omit<Project, 'id' | 'lastUsedAt' | 'createdAt'>;

export type WatcherChangeType = 'created' | 'modified' | 'deleted';

export interface WatcherChange {
  path: string;
  type: WatcherChangeType;
  mtimeMs: number;
}

export interface WatcherStatus {
  active: boolean;
  dirs: string[];
  fallback: boolean;
  pendingCount: number;
}

export type WatcherErrorCode = 'WATCH_DIR_LOST' | 'FILE_LOCKED' | 'WATCHER_ERROR';

export interface WatcherErrorPayload {
  code: WatcherErrorCode;
  message: string;
  path?: string;
}

export interface FileChangedPayload {
  changes: WatcherChange[];
}

export interface IPCEventPayloads {
  'file:changed': FileChangedPayload;
  'watcher:error': WatcherErrorPayload;
}

export interface IPCChannels {
  'config:read': {
    params: void;
    result: AppConfig;
  };
  'config:write': {
    params: Partial<AppConfig>;
    result: void;
  };
  'project:list': {
    params: void;
    result: Project[];
  };
  'project:switch': {
    params: { projectId: string };
    result: void;
  };
  'project:add': {
    params: NewProject;
    result: Project;
  };
  'project:remove': {
    params: { projectId: string };
    result: void;
  };
  'project:update': {
    params: { projectId: string } & Partial<NewProject>;
    result: Project | null;
  };
  'file:read': {
    params: { path: string };
    result: { content: string; exists: boolean };
  };
  'file:readDirectory': {
    params: { path: string };
    result: { name: string; path: string; isFile: boolean }[];
  };
  'file:write': {
    params: { path: string; content: string; lastMtimeMs?: number };
    result: { mtimeMs: number };
  };
  'file:lock': {
    params: { path: string; owner: 'ui' | 'agent' };
    result: { acquired: boolean; owner?: 'ui' | 'agent' };
  };
  'file:unlock': {
    params: { path: string };
    result: void;
  };
  'file:lockStatus': {
    params: { path: string };
    result: { acquired: boolean; owner?: 'ui' | 'agent' };
  };
  'window:getState': {
    params: void;
    result: { isMaximized: boolean };
  };
  'shell:openPath': {
    params: { path: string };
    result: { error: string };
  };
  'dialog:openDirectory': {
    params: void;
    result: { canceled: boolean; filePaths: string[] };
  };
  'watcher:watch': {
    params: { dirs: string[] };
    result: void;
  };
  'watcher:stop': {
    params: void;
    result: void;
  };
  'watcher:status': {
    params: void;
    result: WatcherStatus;
  };
}

export type IPCChannelName = keyof IPCChannels;
