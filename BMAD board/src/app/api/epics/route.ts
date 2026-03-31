import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { initializeStore, persistEpicStatus } from '@/lib/markdown-parser';
import { CreateEpicRequest, EpicStatus } from '@/lib/types';

function ensureInit() {
  initializeStore();
}

export async function GET(request: NextRequest) {
  ensureInit();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const epic = store.getEpic(id) || store.getEpicByKey(id);
    if (!epic) return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    const stories = store.getStoriesByEpic(epic.id);
    return NextResponse.json({ ...epic, storiesData: stories });
  }

  const epics = store.getAllEpics();
  const epicsWithCounts = epics.map((epic) => ({
    ...epic,
    storyCount: store.getStoriesByEpic(epic.id).length,
    doneCount: store.getStoriesByEpic(epic.id).filter((s) => s.status === 'done').length,
  }));

  return NextResponse.json(epicsWithCounts);
}

export async function POST(request: NextRequest) {
  ensureInit();
  try {
    const body: CreateEpicRequest = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const epic = store.createEpic(body);
    return NextResponse.json(epic, { status: 201 });
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

    if (updates.status) {
      const epic = store.updateEpicStatus(id, updates.status as EpicStatus);
      if (!epic) return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
      persistEpicStatus(epic.key, updates.status as EpicStatus);
      return NextResponse.json(epic);
    }

    const epic = store.updateEpic(id, updates);
    if (!epic) return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    return NextResponse.json(epic);
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

  const deleted = store.deleteEpic(id);
  if (!deleted) return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}