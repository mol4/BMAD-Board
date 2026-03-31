import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { initializeStore } from '@/lib/markdown-parser';
import { CreateTaskRequest, TaskStatus } from '@/lib/types';

function ensureInit() {
  initializeStore();
}

export async function GET(request: NextRequest) {
  ensureInit();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const storyId = searchParams.get('storyId');

  if (id) {
    const task = store.getTask(id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
  }

  if (storyId) {
    return NextResponse.json(store.getTasksByStory(storyId));
  }

  return NextResponse.json(store.getAllTasks());
}

export async function POST(request: NextRequest) {
  ensureInit();
  try {
    const body: CreateTaskRequest = await request.json();

    if (!body.title || !body.storyId) {
      return NextResponse.json(
        { error: 'Title and storyId are required' },
        { status: 400 }
      );
    }

    const task = store.createTask(body);
    return NextResponse.json(task, { status: 201 });
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
      const task = store.updateTaskStatus(id, updates.status as TaskStatus);
      if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      return NextResponse.json(task);
    }

    const task = store.updateTask(id, updates);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
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

  const deleted = store.deleteTask(id);
  if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}