import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { store } from '@/lib/store';
import { initializeStore } from '@/lib/markdown-parser';

function ensureInit() {
  initializeStore();
}

/**
 * GET /api/stories/[id]/markdown
 * Returns markdown content for any story (file-based or inline).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureInit();

  const story = store.getStory(params.id) || store.getStoryByKey(params.id);
  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const hasFile = story.sourceFile && !story.sourceFile.endsWith('epics.md');

  let fileContent: string | null = null;
  if (hasFile && story.sourceFile && fs.existsSync(story.sourceFile)) {
    fileContent = fs.readFileSync(story.sourceFile, 'utf-8');
  }

  return NextResponse.json({
    key: story.key,
    title: story.title,
    hasFile: !!hasFile,
    fileName: hasFile && story.sourceFile ? path.basename(story.sourceFile) : null,
    markdown: fileContent || story.rawMarkdown || '',
  });
}

/**
 * PUT /api/stories/[id]/markdown
 * Save markdown content back to the source file.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureInit();

  const story = store.getStory(params.id) || store.getStoryByKey(params.id);
  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const body = await request.json();
  const markdown = body.markdown;

  if (typeof markdown !== 'string') {
    return NextResponse.json({ error: 'markdown field required' }, { status: 400 });
  }

  const hasFile = story.sourceFile && !story.sourceFile.endsWith('epics.md');

  if (hasFile && story.sourceFile) {
    fs.writeFileSync(story.sourceFile, markdown, 'utf-8');
  } else if (story.sourceFile && story.sourceFile.endsWith('epics.md') && fs.existsSync(story.sourceFile)) {
    store.updateStory(story.id, { rawMarkdown: markdown });
    const fileContent = fs.readFileSync(story.sourceFile, 'utf-8');
    const storyRef = story.key.replace('STORY-', ''); // e.g. "1.2"
    const escapedRef = storyRef.replace('.', '\\.');
    const sectionPattern = new RegExp(`^(### Story ${escapedRef}:\\s+.+)$`, 'm');
    const sectionMatch = fileContent.match(sectionPattern);

    if (sectionMatch && sectionMatch.index !== undefined) {
      const sectionStart = sectionMatch.index;
      const rest = fileContent.slice(sectionStart + sectionMatch[0].length);
      const nextHeading = rest.match(/^###? (?:Story \d+\.\d+:|Epic \d+:)/m);
      const sectionEnd = nextHeading && nextHeading.index !== undefined
        ? sectionStart + sectionMatch[0].length + nextHeading.index
        : fileContent.length;

      const before = fileContent.slice(0, sectionStart);
      const after = fileContent.slice(sectionEnd);
      const newContent = before + markdown.trim() + '\n\n' + after;
      fs.writeFileSync(story.sourceFile, newContent.replace(/\n{3,}/g, '\n\n'), 'utf-8');
    }
  } else {
    store.updateStory(story.id, { rawMarkdown: markdown });
  }

  return NextResponse.json({ success: true, hasFile: !!hasFile });
}