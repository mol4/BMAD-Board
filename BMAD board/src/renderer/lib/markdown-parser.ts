import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/lib/store';
import { getConfig, getEpicsPath, getStoriesPath } from '@/lib/config';
import type { Epic, Story, EpicStatus, StoryStatus, Priority } from '@/lib/types';

let _lastSprintMeta: { project: string; generated: string; lastUpdated: string } | null = null;
let _syncInProgress = false;

export function getSprintMeta() {
  return _lastSprintMeta;
}

async function ipcReadFile(path: string): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.fileRead(path);
      return result.exists ? result.content : null;
    }
  } catch (err) {
    console.warn(`[BMAD Sync] Failed to read file ${path}:`, err);
  }
  return null;
}

async function ipcReadDirectory(path: string): Promise<{ name: string; path: string; isFile: boolean }[]> {
  try {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.fileReadDirectory(path);
      console.log(`[BMAD Sync] Read directory ${path}: ${result?.length ?? 0} entries`);
      return result || [];
    }
  } catch (err) {
    console.warn(`[BMAD Sync] Failed to read directory ${path}:`, err);
  }
  return [];
}

export async function syncMarkdownToStore(): Promise<{ epics: number; stories: number }> {
  if (_syncInProgress) {
    console.log('[BMAD Sync] Sync already in progress, skipping');
    return { epics: 0, stories: 0 };
  }
  if (useAppStore.getState().initialized) {
    console.log('[BMAD Sync] Store already initialized, skipping');
    return { epics: useAppStore.getState().getAllEpics().length, stories: useAppStore.getState().getAllStories().length };
  }

  _syncInProgress = true;
  try {
    const config = getConfig();
    console.log('[BMAD Sync] Starting sync, config:', config);
    useAppStore.getState().clear();

    const epicsDir = getEpicsPath();
    const storiesDir = getStoriesPath();
    console.log('[BMAD Sync] Paths — epics:', epicsDir, 'stories:', storiesDir);

    let epicCount = 0;
    let storyCount = 0;

    if (config.storiesMode === 'flat') {
      const result = await syncFlatMode(epicsDir, storiesDir);
      epicCount = result.epics;
      storyCount = result.stories;
    } else {
      const result = await syncNestedMode(epicsDir);
      epicCount = result.epics;
      storyCount = result.stories;
    }

    // Apply sprint-status.yaml overrides
    const sprintData = await parseSprintStatusAsync(storiesDir);
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
          const epic = useAppStore.getState().getEpicByKey(`EPIC-${epicNum}`);
          if (epic) {
            useAppStore.getState().updateEpic(epic.id, { status: mapSprintEpicStatus(status) });
          }
          continue;
        }
        if (key.includes('-retrospective')) continue;
        const storyNumMatch = key.match(/^(\d+[\w]*)-(\d+)-/);
        if (storyNumMatch) {
          const storyKey = `STORY-${storyNumMatch[1]}.${storyNumMatch[2]}`;
          const story = useAppStore.getState().getStoryByKey(storyKey);
          if (story) {
            useAppStore.getState().updateStory(story.id, { status: mapSprintStoryStatus(status) });
          }
        }
      }
    }

    useAppStore.getState().setInitialized(true);
    console.log(`[BMAD Sync] Sync complete: ${epicCount} epics, ${storyCount} stories`);
    return { epics: epicCount, stories: storyCount };
  } catch (err) {
    console.error('[BMAD Sync] Failed:', err);
    useAppStore.getState().setInitialized(true);
    return { epics: 0, stories: 0 };
  } finally {
    _syncInProgress = false;
  }
}

async function ipcReadAllFiles(dirPath: string): Promise<{ name: string; path: string }[]> {
  const result: { name: string; path: string }[] = [];
  const entries = await ipcReadDirectory(dirPath);

  for (const entry of entries) {
    if (entry.isFile && entry.name.endsWith('.md')) {
      result.push({ name: entry.name, path: entry.path });
    } else if (!entry.isFile) {
      const nested = await ipcReadAllFiles(entry.path);
      result.push(...nested);
    }
  }

  return result;
}

async function syncFlatMode(epicsDir: string, storiesDir: string): Promise<{ epics: number; stories: number }> {
  let epicCount = 0;
  let storyCount = 0;
  const inlineStoriesBuffer: Story[] = [];

  const epicFiles = await ipcReadAllFiles(epicsDir);
  console.log(`[BMAD Sync] Found ${epicFiles.length} .md files in epics dir`);

  for (const entry of epicFiles) {
    try {
      const content = await ipcReadFile(entry.path);
      if (!content) continue;

      const hasMultipleEpics = (content.match(/^## Epic \d+:/gm) || []).length > 1;

      if (hasMultipleEpics) {
        const epics = parseEpicsDocument(content, entry.path);
        for (const epic of epics) {
          useAppStore.getState().insertEpic(epic);
          epicCount++;
        }
        // Collect inline stories but do NOT add them to the store yet.
        // They will be added after story files are loaded, skipping those
        // that already have an implementation file.
        const inlineStories = getInlineStories(content);
        for (const story of inlineStories) {
          inlineStoriesBuffer.push(story);
        }
      } else {
        const hasEpicHeading = /^#{1,3}\s+Epic\s/i.test(content);
        if (!hasEpicHeading) continue;
        const epic = parseEpicFile(content, entry.path, epicCount + 1);
        if (epic) {
          useAppStore.getState().insertEpic(epic);
          epicCount++;
        }
      }
    } catch (err) {
      console.error(`[BMAD Sync] Error processing ${entry.name}:`, err);
    }
  }

  const storyFiles = await ipcReadAllFiles(storiesDir);
  console.log(`[BMAD Sync] Found ${storyFiles.length} .md files in stories dir`);

  for (const entry of storyFiles) {
    try {
      const content = await ipcReadFile(entry.path);
      if (!content) continue;

      const allEpics = useAppStore.getState().getAllEpics();
      if (allEpics.length === 0) continue;

      const filenameEpicMatch = entry.name.match(/^(\d+)-/);
      let targetEpicId = allEpics[0].id;
      const { data: parsedFrontmatter } = matter(content);
      const epicKey = parsedFrontmatter?.epicId || parsedFrontmatter?.epic_key || parsedFrontmatter?.epic;
      if (epicKey) {
        const epicKeyStr = String(epicKey);
        const normalizedEpicKey = epicKeyStr.startsWith('EPIC-') ? epicKeyStr : `EPIC-${epicKeyStr}`;
        const epic = useAppStore.getState().getEpicByKey(normalizedEpicKey);
        if (epic) targetEpicId = epic.id;
      } else if (filenameEpicMatch) {
        const epicNum = parseInt(filenameEpicMatch[1], 10);
        const epic = useAppStore.getState().getEpicByKey(`EPIC-${epicNum}`);
        if (epic) targetEpicId = epic.id;
      }

      const story = parseStoryFile(content, targetEpicId, entry.path, storyCount + 1);
      if (story) {
        useAppStore.getState().insertStory(story);
        const epic = useAppStore.getState().getEpic(targetEpicId);
        if (epic && !epic.stories.includes(story.id)) {
          epic.stories.push(story.id);
        }
        storyCount++;
      }
    } catch (err) {
      console.error(`[BMAD Sync] Error processing ${entry.name}:`, err);
    }
  }

  // Fill in inline stories that do not have a dedicated story file
  const existingStoryKeys = new Set(useAppStore.getState().stories.map((s) => s.key));
  let inlineCount = 0;
  for (const inlineStory of inlineStoriesBuffer) {
    if (existingStoryKeys.has(inlineStory.key)) {
      continue; // already imported from implementation-artifacts
    }
    // Re-resolve epicId: inline stories store the original epic UUID,
    // but the epic's id may differ if it was re-inserted
    const epicNumMatch = inlineStory.key.match(/STORY-(\d+[\w]*)\./);
    const epicKey = epicNumMatch ? `EPIC-${epicNumMatch[1]}` : null;
    const parentEpic = epicKey ? useAppStore.getState().getEpicByKey(epicKey) : null;
    if (parentEpic) {
      inlineStory.epicId = parentEpic.id;
    }
    useAppStore.getState().insertStory(inlineStory);
    const epic = parentEpic || useAppStore.getState().getEpic(inlineStory.epicId);
    if (epic && !epic.stories.includes(inlineStory.id)) {
      epic.stories.push(inlineStory.id);
    }
    inlineCount++;
    storyCount++;
  }

  console.log(`[BMAD Sync] Loaded ${epicCount} epics and ${storyCount} stories (${inlineCount} from epics.md inline)`);
  return { epics: epicCount, stories: storyCount };
}

async function syncNestedMode(epicsDir: string): Promise<{ epics: number; stories: number }> {
  let epicCount = 0;
  let storyCount = 0;

  const files = await ipcReadAllFiles(epicsDir);
  for (const entry of files) {
    const content = await ipcReadFile(entry.path);
    if (!content) continue;

    const epics = parseEpicsDocument(content);
    for (const epic of epics) {
      useAppStore.getState().insertEpic(epic);
      epicCount++;

      const inlineStories = getInlineStories(content);
      for (const story of inlineStories) {
        story.epicId = epic.id;
        useAppStore.getState().insertStory(story);
        storyCount++;
      }
    }
  }

  return { epics: epicCount, stories: storyCount };
}

export async function initializeStore() {
  if (!useAppStore.getState().initialized) {
    await syncMarkdownToStore();
  }
}

export function persistStoryStatus(_storyKey: string, _newStatus: StoryStatus): boolean {
  // TODO: Implement IPC file write when file:write channel is added
  return false;
}

export function persistEpicStatus(_epicKey: string, _newStatus: EpicStatus): boolean {
  // TODO: Implement IPC file write when file:write channel is added
  return false;
}

export function ensureBmadDirectories() {
}

export function parseEpicsDocument(raw: string, filePath?: string): Epic[] {
  const { content } = matter(raw);
  const matches = [...content.matchAll(/^## Epic (\d+):\s+(.+)$/gm)];
  const deduped = new Map<string, Epic>();

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
  }

  return Array.from(deduped.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function parseEpicFile(raw: string, _filePath: string, fallbackNum: number): Epic | null {
  try {
    const { data, content } = matter(raw);

    const title =
      data.title ||
      extractFirstHeading(content) ||
      _filePath.replace(/^.*[\\\/]/, '').replace(/\.md$/, '').replace(/-/g, ' ');

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
      sourceFile: _filePath,
      rawMarkdown: raw,
    };

    return epic;
  } catch (err) {
    console.error(`[BMAD Sync] Error parsing epic content`, err);
    return null;
  }
}

export function parseStoryFile(raw: string, epicId: string, _filePath: string, fallbackNum: number): Story | null {
  try {
    const { data, content } = matter(raw);

    const hasStoryHeading = /^#\s+Story\s+\d+[\.\d]*:/im.test(content);
    const hasStatusLine = /^Status:/im.test(content);
    if (!hasStoryHeading && !hasStatusLine) return null;

    const title =
      data.title ||
      extractFirstHeading(content) ||
      _filePath.replace(/^.*[\\\/]/, '').replace(/\.md$/, '').replace(/-/g, ' ');

    const rawStoryId = data.story_id || data.id;
    const storyRef = rawStoryId
      ? String(rawStoryId)
      : extractStoryRefFromContentOrFilename(content, _filePath) || String(fallbackNum);

    const statusLine = content.match(/^Status:\s*(.+)$/im);
    const rawStatus = statusLine ? statusLine[1].trim() : (data.status as string);

    const story: Story = {
      id: uuidv4(),
      key: `STORY-${storyRef}`,
      epicId,
      title,
      description: extractDescription(content),
      acceptanceCriteria: extractAcceptanceCriteria(content),
      status: mapStoryStatus(rawStatus),
      priority: mapPriority(data.priority),
      storyPoints: data.storyPoints || data.story_points || data.points,
      assignee: data.assignee,
      tasks: [],
      labels: Array.isArray(data.labels) ? data.labels : data.labels ? [data.labels] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceFile: _filePath,
      rawMarkdown: raw,
    };

    return story;
  } catch (err) {
    console.error(`[BMAD Sync] Error parsing story content`, err);
    return null;
  }
}

export function getInlineStories(raw: string): Story[] {
  const stories: Story[] = [];
  const { content } = matter(raw);
  const epicMatches = [...content.matchAll(/^## Epic (\d+):/gm)];

  for (const epicMatch of epicMatches) {
    const epicNumber = epicMatch[1];
    const epicId = uuidv4();

    const start = epicMatch.index ?? 0;
    const nextEpicStart = (() => {
      const idx = epicMatches.indexOf(epicMatch);
      return epicMatches[idx + 1]?.index ?? content.length;
    })();
    const section = content.slice(start, nextEpicStart);

    const storyMatches = [...section.matchAll(/^### Story (\d+\.\d+):\s+(.+)$/gm)];
    for (const sMatch of storyMatches) {
      const storyRef = sMatch[1];
      const storyTitle = sMatch[2].trim();
      const sStart = sMatch.index ?? 0;
      const sNext = (() => {
        const idx = storyMatches.indexOf(sMatch);
        return storyMatches[idx + 1]?.index ?? section.length;
      })();
      const storySection = section.slice(sStart, sNext);

      stories.push({
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
      });
    }
  }

  return stories;
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
  const lines = storySection.split('\n').slice(1);
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

export function extractAcceptanceCriteria(content: string): string[] {
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

function extractStoryRefFromContentOrFilename(content: string, filePath: string): string | null {
  const headingMatch = content.match(/^#\s+Story\s+(\d+[\.\d]*):/im);
  if (headingMatch) return headingMatch[1];

  const basename = filePath.replace(/^.*[\\\/]/, '');
  const dashMatch = basename.match(/^(\d+)-(\d+)-/);
  if (dashMatch) return `${dashMatch[1]}.${dashMatch[2]}`;

  const genericMatch = basename.match(/^story-(\d+)/i);
  if (genericMatch) return genericMatch[1];

  return null;
}

// ─── Sprint status parsing ───────────────────────────

interface SprintYaml {
  project?: string;
  generated?: string;
  last_updated?: string;
  development_status?: Record<string, string>;
}

async function parseSprintStatusAsync(storiesDir: string): Promise<SprintYaml | null> {
  const candidates = [
    `${storiesDir}/sprint-status.yaml`,
    `${storiesDir}/sprint-status.yml`,
  ];
  for (const filePath of candidates) {
    try {
      const content = await ipcReadFile(filePath);
      if (content) {
        const yaml = await import('js-yaml');
        return yaml.load(content) as SprintYaml;
      }
    } catch (err) {
      console.error('[BMAD Sync] Error parsing sprint-status.yaml:', err);
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
