import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { store } from '@/lib/store';
import { getConfig, getEpicsPath, getStoriesPath } from '@/lib/config';
import { initializeStore, getSprintMeta } from '@/lib/markdown-parser';

export async function GET() {
  initializeStore();

  const config = getConfig();
  const epicsDir = getEpicsPath();
  const storiesDir = getStoriesPath();

  const epicsFiles: string[] = [];
  const storiesFiles: string[] = [];

  if (fs.existsSync(epicsDir)) {
    for (const entry of fs.readdirSync(epicsDir, { withFileTypes: true })) {
      if (entry.isFile()) {
        epicsFiles.push(entry.name);
      }
    }
  }

  if (fs.existsSync(storiesDir)) {
    for (const entry of fs.readdirSync(storiesDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        storiesFiles.push(entry.name);
      }
    }
  }

  const allEpics = store.getAllEpics();
  const allStories = store.getAllStories();

  const epicSummaries = allEpics.map((epic) => {
    const stories = store.getStoriesByEpic(epic.id);
    const fileStories = stories.filter(
      (s) => s.sourceFile && !s.sourceFile.endsWith('epics.md')
    );
    const inlineStories = stories.filter(
      (s) => s.sourceFile && s.sourceFile.endsWith('epics.md')
    );

    return {
      key: epic.key,
      title: epic.title,
      status: epic.status,
      totalStories: stories.length,
      fileStories: fileStories.length,
      inlineStories: inlineStories.length,
      storiesByStatus: {
        backlog: stories.filter((s) => s.status === 'backlog').length,
        todo: stories.filter((s) => s.status === 'todo').length,
        'in-progress': stories.filter((s) => s.status === 'in-progress').length,
        'in-review': stories.filter((s) => s.status === 'in-review').length,
        done: stories.filter((s) => s.status === 'done').length,
      },
    };
  });

  const storyDetails = allStories.map((s) => ({
    key: s.key,
    title: s.title,
    epicId: allEpics.find((e) => e.id === s.epicId)?.key || s.epicId,
    status: s.status,
    source: s.sourceFile?.endsWith('epics.md') ? 'inline' : 'file',
    sourceFile: s.sourceFile ? path.basename(s.sourceFile) : null,
    acceptanceCriteriaCount: s.acceptanceCriteria.length,
  }));

  return NextResponse.json({
    config: {
      epicsDir: config.epicsDir,
      storiesDir: config.storiesDir,
      storiesMode: config.storiesMode,
      resolvedEpicsPath: epicsDir,
      resolvedStoriesPath: storiesDir,
    },
    filesOnDisk: {
      epicsDir: epicsFiles,
      storiesDir: storiesFiles,
    },
    summary: {
      totalEpics: allEpics.length,
      totalStories: allStories.length,
      fileBasedStories: allStories.filter(
        (s) => s.sourceFile && !s.sourceFile.endsWith('epics.md')
      ).length,
      inlineStories: allStories.filter(
        (s) => s.sourceFile && s.sourceFile.endsWith('epics.md')
      ).length,
    },
    sprintMeta: getSprintMeta(),
    epics: epicSummaries,
    stories: storyDetails,
  });
}