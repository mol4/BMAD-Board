export interface AppConfig {
  epicsDir: string;
  storiesDir: string;
  storiesMode: 'nested' | 'flat';
  lastProjectId: string | null;
}

export interface Project {
  id: string;
  name: string;
  epicsDir: string;
  storiesDir: string;
  storiesMode: 'nested' | 'flat';
  lastUsedAt: string | null;
  createdAt: string;
}

export type NewProject = Omit<Project, 'id' | 'lastUsedAt' | 'createdAt'>;

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
  'file:read': {
    params: { path: string };
    result: { content: string; exists: boolean };
  };
  'file:readDirectory': {
    params: { path: string };
    result: { name: string; path: string; isFile: boolean }[];
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
}

export type IPCChannelName = keyof IPCChannels;
