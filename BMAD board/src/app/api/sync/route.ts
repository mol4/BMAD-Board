import { NextResponse } from 'next/server';
import { syncMarkdownToStore } from '@/lib/markdown-parser';
import { store } from '@/lib/store';

export async function POST() {
  try {
    const result = syncMarkdownToStore();
    return NextResponse.json({
      success: true,
      message: `Synced ${result.epics} epics and ${result.stories} stories from markdown files`,
      ...result,
      stats: store.getStats(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Sync failed', details: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(store.getStats());
}