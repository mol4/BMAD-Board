import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { store } from '@/lib/store';
import { initializeStore } from '@/lib/markdown-parser';

function ensureInit() {
  initializeStore();
}

/**
 * PUT /api/epics/[id]/markdown
 * Save markdown content back to the epic's rawMarkdown (and sourceFile if it exists).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureInit();

  const epic = store.getEpic(params.id) || store.getEpicByKey(params.id);
  if (!epic) {
    return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
  }

  const body = await request.json();
  const markdown = body.markdown;

  if (typeof markdown !== 'string') {
    return NextResponse.json({ error: 'markdown field required' }, { status: 400 });
  }

  store.updateEpic(epic.id, { rawMarkdown: markdown });

  if (epic.sourceFile && fs.existsSync(epic.sourceFile)) {
    const fileContent = fs.readFileSync(epic.sourceFile, 'utf-8');

    const epicHeadingPattern = /^## Epic \d+:/gm;
    const headings = [...fileContent.matchAll(epicHeadingPattern)];

    if (headings.length > 1 && epic.key) {
      const epicNum = epic.key.replace('EPIC-', '');
      const sectionPattern = new RegExp(
        `^(## Epic ${epicNum}:\\s+.+)$`,
        'm'
      );
      const sectionMatch = fileContent.match(sectionPattern);

      if (sectionMatch && sectionMatch.index !== undefined) {
        const sectionStart = sectionMatch.index;
        const rest = fileContent.slice(sectionStart + sectionMatch[0].length);
        const nextHeading = rest.match(/^## Epic \d+:/m);
        const sectionEnd = nextHeading && nextHeading.index !== undefined
          ? sectionStart + sectionMatch[0].length + nextHeading.index
          : fileContent.length;

        const before = fileContent.slice(0, sectionStart);
        const after = fileContent.slice(sectionEnd);
        const newContent = before + markdown.trim() + '\n\n' + after;
        fs.writeFileSync(epic.sourceFile, newContent.replace(/\n{3,}/g, '\n\n'), 'utf-8');
      }
    } else {
      fs.writeFileSync(epic.sourceFile, markdown, 'utf-8');
    }
  }

  return NextResponse.json({ success: true });
}