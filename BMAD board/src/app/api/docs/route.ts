import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '@/lib/config';

const ROOT = process.cwd();

function resolve(p: string): string {
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

/** Walk a directory recursively and collect files. */
function walkDir(dir: string, base: string): { relPath: string; absPath: string }[] {
  const results: { relPath: string; absPath: string }[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(base, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results.push(...walkDir(abs, base));
    } else {
      results.push({ relPath: rel, absPath: abs });
    }
  }
  return results;
}

export async function GET() {
  const config = getConfig();
  const epicsDir = path.normalize(resolve(config.epicsDir));
  const storiesDir = path.normalize(resolve(config.storiesDir));

  const bmadRoot = path.resolve(epicsDir, '..');

  if (!fs.existsSync(bmadRoot)) {
    return NextResponse.json([]);
  }

  const allFiles = walkDir(bmadRoot, bmadRoot);

  const docExtensions = new Set(['.md', '.html']);
  const excludeNames = new Set(['epics.md', 'sprint-status.yaml', 'sprint-status.yml']);

  const docs = allFiles.filter(({ relPath, absPath }) => {
    const ext = path.extname(absPath).toLowerCase();
    if (!docExtensions.has(ext)) return false;
    const basename = path.basename(absPath);
    if (excludeNames.has(basename)) return false;
    const normalizedAbs = path.normalize(absPath);
    if (normalizedAbs.startsWith(storiesDir + path.sep) || normalizedAbs === storiesDir) return false;
    return true;
  });

  const result = docs.map(({ relPath, absPath }) => {
    const stat = fs.statSync(absPath);
    const basename = path.basename(absPath);
    const name = basename.replace(/\.(md|html)$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    let category = 'Документы';
    if (relPath.includes('research')) category = 'Исследования';
    else if (relPath.includes('implementation')) category = 'Реализация';
    else if (relPath.includes('planning')) category = 'Планирование';

    return {
      id: Buffer.from(relPath).toString('base64url'),
      name,
      fileName: basename,
      relPath,
      category,
      ext: path.extname(absPath).replace('.', ''),
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
    };
  });

  return NextResponse.json(result);
}