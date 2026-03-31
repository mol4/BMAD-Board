import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store';
import { Epic, Story, EpicStatus, StoryStatus, Priority } from './types';
import { getConfig, getEpicsPath, getStoriesPath } from './config';

/** Parse BMAD markdown files and load them into the in-memory store. */
export function syncMarkdownToStore(): { epics: number; stories: number } {
  const config = getConfig();
  const epicsDir = getEpicsPath();
  const storiesDir = getStoriesPath();

  let epicCount = 0;
  let storyCount = 0;

  if (!fs.existsSync(epicsDir)) {
    console.log('[BMAD Sync] No epics directory found at', epicsDir);
    return { epics: 0, stories: 0 };
  }

  store.clear();

  const epicEntries = fs.readdirSync(epicsDir, { withFileTypes: true });
  const aggregateEpicsFile = path.join(epicsDir, 'epics.md');

  if (fs.existsSync(aggregateEpicsFile)) {
    const epics = parseEpicsDocument(aggregateEpicsFile);
    for (const epic of epics) {
      store.insertEpic(epic);
      epicCount++;
    }
  } else {
    const epicFiles = epicEntries.filter((e) => e.isFile() && e.name.endsWith('.md'));

    for (const epicFile of epicFiles) {
      const filePath = path.join(epicsDir, epicFile.name);
      const epic = parseEpicFile(filePath, epicCount + 1);
      if (epic) {
        store.insertEpic(epic);
        epicCount++;
      }
    }
  }

  if (config.storiesMode === 'flat') {
    if (!fs.existsSync(storiesDir)) {
      console.log('[BMAD Sync] No stories directory found at', storiesDir);
    } else {
      const storyFiles = fs
        .readdirSync(storiesDir)
        .filter((f) => f.endsWith('.md') && f !== 'epics.md');

      for (const storyFile of storyFiles) {
        const storyPath = path.join(storiesDir, storyFile);
        const story = parseFlatStoryFile(storyPath, storyCount + 1);
        if (story) {
          const parentEpic = resolveStoryEpic(storyPath, story.epicId);
          if (!parentEpic) {
            continue;
          }

          story.epicId = parentEpic.id;
          store.insertStory(story);
          const epic = store.getEpic(parentEpic.id);
          if (epic && !epic.stories.includes(story.id)) {
            epic.stories.push(story.id);
          }
          storyCount++;
        }
      }
    }
  } else {
    const epicDirs = epicEntries.filter((e) => e.isDirectory());

    for (const epicDir of epicDirs) {
      const dirPath = path.join(epicsDir, epicDir.name);
      const parentEpicFile = `${epicDir.name}.md`;
      const allEpics = store.getAllEpics();
      const parentEpic = allEpics.find(
        (e) => e.sourceFile && path.basename(e.sourceFile) === parentEpicFile
      );

      if (!parentEpic) {
        console.log(`[BMAD Sync] No parent epic found for directory: ${epicDir.name}`);
        continue;
      }

      const storyFiles = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'));

      for (const storyFile of storyFiles) {
        const storyPath = path.join(dirPath, storyFile);
        const story = parseStoryFile(storyPath, parentEpic.id, storyCount + 1);
        if (story) {
          store.insertStory(story);
          const epic = store.getEpic(parentEpic.id);
          if (epic && !epic.stories.includes(story.id)) {
            epic.stories.push(story.id);
          }
          storyCount++;
        }
      }
    }
  }

  recalculateImportedEpicStatuses();

  const existingStoryKeys = new Set(store.getAllStories().map((s) => s.key));
  let inlineCount = 0;
  for (const inlineStory of _inlineStories) {
    if (existingStoryKeys.has(inlineStory.key)) {
      continue; // already imported from implementation-artifacts
    }
    const epicNumMatch = inlineStory.key.match(/STORY-(\d+)\./);
    const epicKey = epicNumMatch ? `EPIC-${epicNumMatch[1]}` : null;
    const parentEpic = epicKey ? store.getEpicByKey(epicKey) : null;
    if (parentEpic) {
      inlineStory.epicId = parentEpic.id;
    }
    store.insertStory(inlineStory);
    const epic = parentEpic || store.getEpic(inlineStory.epicId);
    if (epic && !epic.stories.includes(inlineStory.id)) {
      epic.stories.push(inlineStory.id);
    }
    inlineCount++;
    storyCount++;
  }

  const sprintData = parseSprintStatus(storiesDir);
  if (sprintData) {
    _lastSprintMeta = {
      project: sprintData.project || '',
      generated: sprintData.generated || '',
      lastUpdated: sprintData.last_updated || '',
    };
    const devStatus = sprintData.development_status || {};
    for (const [key, statusVal] of Object.entries(devStatus)) {
      const status = String(statusVal);
      if (key.startsWith('epic-') && !key.includes('-retrospective')) {
        const epicNum = key.replace('epic-', '');
        const epic = store.getEpicByKey(`EPIC-${epicNum}`);
        if (epic) {
          store.updateEpic(epic.id, { status: mapSprintEpicStatus(status) });
        }
        continue;
      }
      if (key.includes('-retrospective')) continue;
      const storyNumMatch = key.match(/^(\d+)-(\d+)-/);
      if (storyNumMatch) {
        const storyKey = `STORY-${storyNumMatch[1]}.${storyNumMatch[2]}`;
        const story = store.getStoryByKey(storyKey);
        if (story) {
          store.updateStory(story.id, { status: mapSprintStoryStatus(status) });
        }
      }
    }
  }

  recalculateImportedEpicStatuses();
  store.setInitialized(true);
  console.log(
    `[BMAD Sync] Loaded ${epicCount} epics and ${storyCount} stories ` +
    `(${inlineCount} from epics.md inline, mode=${config.storiesMode}, epics=${epicsDir}, stories=${storiesDir})`
  );
  return { epics: epicCount, stories: storyCount };
}

function recalculateImportedEpicStatuses() {
  for (const epic of store.getAllEpics()) {
    const stories = store.getStoriesByEpic(epic.id);
    let status: EpicStatus = 'draft';

    if (stories.length === 0) {
      status = 'draft';
    } else if (stories.every((story) => story.status === 'done')) {
      status = 'done';
    } else if (stories.some((story) => story.status !== 'backlog' && story.status !== 'todo')) {
      status = 'in-progress';
    } else {
      status = 'ready';
    }

    store.updateEpic(epic.id, { status });
  }
}

function resolveStoryEpic(storyPath: string, epicIdHint?: string) {
  if (epicIdHint) {
    const byKey = store.getEpicByKey(epicIdHint);
    if (byKey) return byKey;
    const byId = store.getEpic(epicIdHint);
    if (byId) return byId;
  }

  const storyFile = path.basename(storyPath);
  const dashedMatch = storyFile.match(/^(\d+)-(\d+)-/);
  if (dashedMatch) {
    return store.getEpicByKey(`EPIC-${dashedMatch[1]}`);
  }

  const genericMatch = storyFile.match(/^story-(\d+)/i);
  if (genericMatch) {
    return store.getEpicByKey(`EPIC-${genericMatch[1]}`);
  }

  return store.getAllEpics()[0];
}

interface SprintYaml {
  project?: string;
  generated?: string;
  last_updated?: string;
  development_status?: Record<string, string>;
}

let _lastSprintMeta: { project: string; generated: string; lastUpdated: string } | null = null;

export function getSprintMeta() {
  return _lastSprintMeta;
}

function parseSprintStatus(storiesDir: string): SprintYaml | null {
  const candidates = [
    path.join(storiesDir, 'sprint-status.yaml'),
    path.join(storiesDir, 'sprint-status.yml'),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return yaml.load(raw) as SprintYaml;
      } catch (err) {
        console.error('[BMAD Sync] Error parsing sprint-status.yaml:', err);
      }
    }
  }
  return null;
}

function mapSprintStoryStatus(status: string): StoryStatus {
  const s = status.toLowerCase().replace(/\s+/g, '-');
  const map: Record<string, StoryStatus> = {
    backlog: 'backlog',
    'ready-for-dev': 'todo',
    'in-progress': 'in-progress',
    review: 'in-review',
    done: 'done',
  };
  return map[s] || 'backlog';
}

function mapSprintEpicStatus(status: string): EpicStatus {
  const s = status.toLowerCase().replace(/\s+/g, '-');
  const map: Record<string, EpicStatus> = {
    backlog: 'draft',
    'in-progress': 'in-progress',
    done: 'done',
  };
  return map[s] || 'draft';
}

let _inlineStories: Story[] = [];

export function getInlineStories(): Story[] {
  return _inlineStories;
}

function parseEpicsDocument(filePath: string): Epic[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(raw);
  const matches = [...content.matchAll(/^## Epic (\d+):\s+(.+)$/gm)];
  const deduped = new Map<string, Epic>();
  _inlineStories = [];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const epicNumber = current[1];
    const title = current[2].trim();
    const start = current.index ?? 0;
    const end = next?.index ?? content.length;
    const section = content.slice(start, end);
    const description = extractEpicSectionDescription(section);

    const epicId = uuidv4();
    deduped.set(epicNumber, {
      id: epicId,
      key: `EPIC-${epicNumber}`,
      title,
      description,
      status: 'ready',
      priority: inferEpicPriority(section),
      stories: [],
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceFile: filePath,
      rawMarkdown: section.trim(),
    });

    const storyMatches = [...section.matchAll(/^### Story (\d+\.\d+):\s+(.+)$/gm)];
    for (let j = 0; j < storyMatches.length; j++) {
      const sCurrent = storyMatches[j];
      const sNext = storyMatches[j + 1];
      const storyRef = sCurrent[1];
      const storyTitle = sCurrent[2].trim();
      const sStart = sCurrent.index ?? 0;
      const sEnd = sNext?.index ?? section.length;
      const storySection = section.slice(sStart, sEnd);

      _inlineStories.push({
        id: uuidv4(),
        key: `STORY-${storyRef}`,
        epicId: epicId,
        title: storyTitle,
        description: extractInlineStoryDescription(storySection),
        acceptanceCriteria: extractAcceptanceCriteria(storySection),
        status: 'backlog',
        priority: 'medium',
        storyPoints: undefined,
        assignee: undefined,
        tasks: [],
        labels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceFile: filePath,
        rawMarkdown: storySection.trim(),
      });
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function parseEpicFile(filePath: string, fallbackNum: number): Epic | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    const title =
      data.title ||
      extractFirstHeading(content) ||
      path.basename(filePath, '.md').replace(/-/g, ' ');

    const epicNum = data.id
      ? parseInt(String(data.id).replace(/\D/g, ''), 10) || fallbackNum
      : fallbackNum;

    const epic: Epic = {
      id: uuidv4(),
      key: `EPIC-${epicNum}`,
      title,
      description: extractDescription(content),
      status: mapEpicStatus(data.status),
      priority: mapPriority(data.priority),
      stories: [],
      labels: Array.isArray(data.labels) ? data.labels : data.labels ? [data.labels] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceFile: filePath,
      rawMarkdown: raw,
    };

    return epic;
  } catch (err) {
    console.error(`[BMAD Sync] Error parsing epic file: ${filePath}`, err);
    return null;
  }
}

function parseStoryFile(filePath: string, epicId: string, fallbackNum: number): Story | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    const title =
      data.title ||
      extractFirstHeading(content) ||
      path.basename(filePath, '.md').replace(/-/g, ' ');

    const storyNum = data.id
      ? parseInt(String(data.id).replace(/\D/g, ''), 10) || fallbackNum
      : fallbackNum;

    const story: Story = {
      id: uuidv4(),
      key: `STORY-${storyNum}`,
      epicId,
      title,
      description: extractDescription(content),
      acceptanceCriteria: extractAcceptanceCriteria(content),
      status: mapStoryStatus(data.status),
      priority: mapPriority(data.priority),
      storyPoints: data.storyPoints || data.story_points || data.points,
      assignee: data.assignee,
      tasks: [],
      labels: Array.isArray(data.labels) ? data.labels : data.labels ? [data.labels] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceFile: filePath,
      rawMarkdown: raw,
    };

    return story;
  } catch (err) {
    console.error(`[BMAD Sync] Error parsing story file: ${filePath}`, err);
    return null;
  }
}

function parseFlatStoryFile(filePath: string, fallbackNum: number): Story | null {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  if (Object.keys(data).length > 0) {
    return parseStoryFile(filePath, String(data.epicId || data.epicKey || ''), fallbackNum);
  }

  const storyRef = extractStoryReference(content, filePath, fallbackNum);
  const title = extractStoryTitle(content, filePath);
  const statusMatch = content.match(/^Status:\s*(.+)$/mi);

  return {
    id: uuidv4(),
    key: `STORY-${storyRef}`,
    epicId: '',
    title,
    description: extractSection(content, 'Story') || extractDescription(content),
    acceptanceCriteria: extractAcceptanceCriteria(content),
    status: mapStoryStatus(statusMatch?.[1]),
    priority: 'medium',
    storyPoints: undefined,
    assignee: undefined,
    tasks: [],
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceFile: filePath,
    rawMarkdown: raw,
  };
}

function extractFirstHeading(content: string): string | null {
  const match = content.match(/^#+\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractDescription(content: string): string {
  const lines = content.split('\n');
  let started = false;
  const desc: string[] = [];

  for (const line of lines) {
    if (!started && line.match(/^#+\s+/)) {
      started = true;
      continue;
    }
    if (started || !line.match(/^#+\s+/)) {
      if (line.match(/^#+\s+(acceptance criteria|tasks|technical notes)/i)) break;
      desc.push(line);
    }
  }

  return desc.join('\n').trim() || content.trim();
}

function extractSection(content: string, sectionTitle: string): string {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionMatch = content.match(
    new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|^#\\s+|\\Z)`, 'im')
  );
  return sectionMatch?.[1]?.trim() || '';
}

function extractEpicSectionDescription(section: string): string {
  const lines = section.split('\n').slice(1);
  const body: string[] = [];

  for (const line of lines) {
    if (line.match(/^###\s+Story\s+/i) || line.match(/^\*\*FRs covered:\*\*/)) {
      break;
    }
    body.push(line);
  }

  return body.join('\n').trim();
}

function extractInlineStoryDescription(storySection: string): string {
  const lines = storySection.split('\n').slice(1); // skip ### heading
  const body: string[] = [];

  for (const line of lines) {
    if (line.match(/^\*\*Acceptance Criteria/i) || line.match(/^#+\s+Acceptance Criteria/i)) {
      break;
    }
    body.push(line);
  }

  return body.join('\n').trim();
}

function inferEpicPriority(section: string): Priority {
  const lowered = section.toLowerCase();
  if (lowered.includes('critical') || lowered.includes('foundation') || lowered.includes('authentication')) {
    return 'high';
  }
  return 'medium';
}

function extractStoryReference(content: string, filePath: string, fallbackNum: number): string {
  const headingMatch = content.match(/^#\s+Story\s+(\d+\.\d+):/mi);
  if (headingMatch) {
    return headingMatch[1];
  }

  const fileMatch = path.basename(filePath).match(/^(\d+)-(\d+)-/);
  if (fileMatch) {
    return `${fileMatch[1]}.${fileMatch[2]}`;
  }

  return String(fallbackNum);
}

function extractStoryTitle(content: string, filePath: string): string {
  const headingMatch = content.match(/^#\s+Story\s+\d+\.\d+:\s+(.+)$/mi);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  return extractFirstHeading(content) || path.basename(filePath, '.md').replace(/-/g, ' ');
}

function extractAcceptanceCriteria(content: string): string[] {
  const criteria: string[] = [];
  const acSection = content.match(
    /#+\s+acceptance criteria\s*\n([\s\S]*?)(?=\n#+\s|\n---|\n$|$)/i
  );

  if (acSection) {
    const lines = acSection[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^[\s]*(?:[-*]|\d+\.)\s+(.+)/);
      if (match) {
        criteria.push(match[1].trim());
      }
    }
  }

  return criteria;
}

function mapEpicStatus(status?: string): EpicStatus {
  if (!status) return 'draft';
  const s = status.toLowerCase().replace(/\s+/g, '-');
  const map: Record<string, EpicStatus> = {
    draft: 'draft',
    ready: 'ready',
    'in-progress': 'in-progress',
    'in progress': 'in-progress',
    active: 'in-progress',
    done: 'done',
    complete: 'done',
    completed: 'done',
  };
  return map[s] || 'draft';
}

function mapStoryStatus(status?: string): StoryStatus {
  if (!status) return 'backlog';
  const s = status.toLowerCase().replace(/\s+/g, '-');
  const map: Record<string, StoryStatus> = {
    backlog: 'backlog',
    todo: 'todo',
    'to-do': 'todo',
    'to do': 'todo',
    'in-progress': 'in-progress',
    'in progress': 'in-progress',
    active: 'in-progress',
    'in-review': 'in-review',
    'in review': 'in-review',
    review: 'in-review',
    done: 'done',
    complete: 'done',
    completed: 'done',
  };
  return map[s] || 'backlog';
}

function mapPriority(priority?: string): Priority {
  if (!priority) return 'medium';
  const p = priority.toLowerCase();
  const map: Record<string, Priority> = {
    critical: 'critical',
    highest: 'critical',
    high: 'high',
    medium: 'medium',
    normal: 'medium',
    low: 'low',
    lowest: 'low',
  };
  return map[p] || 'medium';
}

function reverseMapStoryStatus(status: StoryStatus): string {
  const map: Record<StoryStatus, string> = {
    backlog: 'backlog',
    todo: 'ready-for-dev',
    'in-progress': 'in-progress',
    'in-review': 'review',
    done: 'done',
  };
  return map[status] || 'backlog';
}

function reverseMapEpicStatus(status: EpicStatus): string {
  const map: Record<EpicStatus, string> = {
    draft: 'backlog',
    ready: 'backlog',
    'in-progress': 'in-progress',
    done: 'done',
  };
  return map[status] || 'backlog';
}

function getSprintStatusFilePath(): string | null {
  const storiesDir = getStoriesPath();
  const candidates = [
    path.join(storiesDir, 'sprint-status.yaml'),
    path.join(storiesDir, 'sprint-status.yml'),
  ];
  for (const fp of candidates) {
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

/**
 * Persist a story status change into sprint-status.yaml.
 * Uses regex replacement to preserve comments and formatting.
 */
export function persistStoryStatus(storyKey: string, newStatus: StoryStatus): boolean {
  const filePath = getSprintStatusFilePath();
  if (!filePath) return false;

  const m = storyKey.match(/STORY-(\d+)\.(\d+)/);
  if (!m) return false;
  const prefix = `${m[1]}-${m[2]}-`;
  const yamlStatus = reverseMapStoryStatus(newStatus);

  try {
    let raw = fs.readFileSync(filePath, 'utf-8');
    const re = new RegExp(`^(\\s*${prefix}[\\w-]*:\\s*)\\S+`, 'm');
    if (!re.test(raw)) return false;
    raw = raw.replace(re, `$1${yamlStatus}`);
    const today = new Date().toISOString().slice(0, 10);
    raw = raw.replace(/^(last_updated:\s*).+$/m, `$1${today}`);
    fs.writeFileSync(filePath, raw, 'utf-8');
    return true;
  } catch (err) {
    console.error('[BMAD] Error writing sprint-status.yaml (story):', err);
    return false;
  }
}

/**
 * Persist an epic status change into sprint-status.yaml.
 */
export function persistEpicStatus(epicKey: string, newStatus: EpicStatus): boolean {
  const filePath = getSprintStatusFilePath();
  if (!filePath) return false;

  const m = epicKey.match(/EPIC-(\d+)/);
  if (!m) return false;
  const yamlKey = `epic-${m[1]}`;
  const yamlStatus = reverseMapEpicStatus(newStatus);

  try {
    let raw = fs.readFileSync(filePath, 'utf-8');
    const re = new RegExp(`^(\\s*${yamlKey}:\\s*)\\S+`, 'm');
    if (!re.test(raw)) return false;
    raw = raw.replace(re, `$1${yamlStatus}`);
    const today = new Date().toISOString().slice(0, 10);
    raw = raw.replace(/^(last_updated:\s*).+$/m, `$1${today}`);
    fs.writeFileSync(filePath, raw, 'utf-8');
    return true;
  } catch (err) {
    console.error('[BMAD] Error writing sprint-status.yaml (epic):', err);
    return false;
  }
}

export function ensureBmadDirectories() {
  const epicsDir = getEpicsPath();
  const storiesDir = getStoriesPath();

  const dirs = [epicsDir, storiesDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function initializeStore() {
  if (!store.isInitialized()) {
    ensureBmadDirectories();
    syncMarkdownToStore();
  }
}