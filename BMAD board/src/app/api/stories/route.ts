import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { initializeStore, persistStoryStatus } from '@/lib/markdown-parser';
import { CreateStoryRequest, StoryStatus } from '@/lib/types';

function ensureInit() {
  initializeStore();
}

export async function GET(request: NextRequest) {
  ensureInit();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const epicId = searchParams.get('epicId');
  const status = searchParams.get('status');

  if (id) {
    const story = store.getStory(id) || store.getStoryByKey(id);
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    const tasks = store.getTasksByStory(story.id);
    const epic = store.getEpic(story.epicId);
    return NextResponse.json({ ...story, tasksData: tasks, epicData: epic });
  }

  if (epicId) {
    const stories = store.getStoriesByEpic(epicId);
    return NextResponse.json(stories);
  }

  if (status) {
    const stories = store.getStoriesByStatus(status as StoryStatus);
    return NextResponse.json(stories);
  }

  return NextResponse.json(store.getAllStories());
}

export async function POST(request: NextRequest) {
  ensureInit();
  try {
    const body: CreateStoryRequest = await request.json();

    if (!body.title || !body.epicId) {
      return NextResponse.json(
        { error: 'Title and epicId are required' },
        { status: 400 }
      );
    }

    const epic = store.getEpic(body.epicId);
    if (!epic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    const story = store.createStory(body);
    return NextResponse.json(story, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  ensureInit();
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (updates.status && Object.keys(updates).length === 1) {
      const story = store.updateStoryStatus(id, updates.status as StoryStatus);
      if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      persistStoryStatus(story.key, updates.status as StoryStatus);
      return NextResponse.json(story);
    }

    const story = store.updateStory(id, updates);
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    return NextResponse.json(story);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  ensureInit();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const deleted = store.deleteStory(id);
  if (!deleted) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}