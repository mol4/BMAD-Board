import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig, resetConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json(getConfig());
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const allowed: Record<string, boolean> = {
      epicsDir: true,
      storiesDir: true,
      storiesMode: true,
    };

    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowed[key] && typeof value === 'string') {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided. Allowed: epicsDir, storiesDir, storiesMode' },
        { status: 400 }
      );
    }

    const config = setConfig(updates);
    return NextResponse.json({
      success: true,
      config,
      message: 'Конфигурация обновлена. Нажмите "Синхронизация" для применения.',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE() {
  const config = resetConfig();
  return NextResponse.json({
    success: true,
    config,
    message: 'Конфигурация сброшена к значениям по умолчанию.',
  });
}