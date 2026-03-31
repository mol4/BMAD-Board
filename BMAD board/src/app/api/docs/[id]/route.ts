import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '@/lib/config';

const ROOT = process.cwd();

function resolve(p: string): string {
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function getBmadRoot(): string {
  const config = getConfig();
  const epicsDir = resolve(config.epicsDir);
  return path.resolve(epicsDir, '..');
}

function resolveDocPath(id: string): string | null {
  try {
    const relPath = Buffer.from(id, 'base64url').toString('utf-8');
    // Security: prevent path traversal
    if (relPath.includes('..')) return null;
    const absPath = path.join(getBmadRoot(), relPath);
    if (!absPath.startsWith(getBmadRoot())) return null;
    if (!fs.existsSync(absPath)) return null;
    return absPath;
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const absPath = resolveDocPath(params.id);
  if (!absPath) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const content = fs.readFileSync(absPath, 'utf-8');
  const basename = path.basename(absPath);
  const relPath = Buffer.from(params.id, 'base64url').toString('utf-8');

  return NextResponse.json({
    id: params.id,
    fileName: basename,
    relPath,
    content,
    ext: path.extname(absPath).replace('.', ''),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const absPath = resolveDocPath(params.id);
  if (!absPath) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const body = await request.json();
  const content = body.content;

  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content field required' }, { status: 400 });
  }

  fs.writeFileSync(absPath, content, 'utf-8');
  return NextResponse.json({ success: true });
}