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
}

export type IPCChannelName = keyof IPCChannels;
