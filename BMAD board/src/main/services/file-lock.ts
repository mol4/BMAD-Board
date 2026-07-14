import { promises as fsp, constants } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { app } from 'electron';
import logger from '../logger';

export interface LockFileData {
  owner: 'ui' | 'agent';
  timestamp: number;
}

export interface AcquireResult {
  acquired: boolean;
  owner?: 'ui' | 'agent';
}

const DEFAULT_STALE_MS = 30000;

export class FileLockManager {
  private lockDir: string;
  private lockCleanupTimer: ReturnType<typeof setInterval> | null = null;
  private staleMs: number;

  constructor(staleMs = DEFAULT_STALE_MS) {
    this.lockDir = join(app.getPath('userData'), 'file-locks');
    this.staleMs = staleMs;
  }

  async ensureLockDir(): Promise<void> {
    try {
      await fsp.mkdir(this.lockDir, { recursive: true });
    } catch (err) {
      logger.error('[FileLockManager] Failed to create lock directory:', err);
      throw err;
    }
  }

  startCleanup(intervalMs = DEFAULT_STALE_MS): void {
    if (this.lockCleanupTimer) return;
    this.ensureLockDir().then(() => {
      this.releaseStaleLocks(this.staleMs);
    }).catch(() => { /* logged in ensureLockDir */ });
    this.lockCleanupTimer = setInterval(() => {
      this.releaseStaleLocks(this.staleMs);
    }, intervalMs);
  }

  stopCleanup(): void {
    if (this.lockCleanupTimer) {
      clearInterval(this.lockCleanupTimer);
      this.lockCleanupTimer = null;
    }
  }

  async acquire(filePath: string, owner: 'ui' | 'agent'): Promise<AcquireResult> {
    await this.ensureLockDir();
    await this.releaseStaleLocks(this.staleMs);

    const lockPath = this.lockPathFor(filePath);

    try {
      const raw = await fsp.readFile(lockPath, 'utf-8');
      const lock: LockFileData = JSON.parse(raw);

      if (lock.owner !== owner) {
        logger.info(`[FileLockManager] Lock held by "${lock.owner}" for ${filePath}, cannot acquire for "${owner}"`);
        return { acquired: false, owner: lock.owner };
      }
    } catch {
      // No lock file or unreadable — safe to acquire
    }

    const lockData: LockFileData = { owner, timestamp: Date.now() };

    try {
      const fd = await fsp.open(lockPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o644);
      try {
        await fd.write(JSON.stringify(lockData), 0, 'utf-8');
      } finally {
        await fd.close();
      }
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === 'EEXIST') {
        const raw = await fsp.readFile(lockPath, 'utf-8').catch(() => null);
        if (raw) {
          const lock: LockFileData = JSON.parse(raw);
          if (lock.owner !== owner) {
            logger.info(`[FileLockManager] Lock held by "${lock.owner}" for ${filePath} (atomic check), cannot acquire for "${owner}"`);
            return { acquired: false, owner: lock.owner };
          }
        }
        await fsp.writeFile(lockPath, JSON.stringify(lockData), 'utf-8');
      } else {
        throw err;
      }
    }

    logger.info(`[FileLockManager] Lock acquired by "${owner}" for ${filePath}`);
    return { acquired: true, owner };
  }

  async release(filePath: string): Promise<void> {
    const lockPath = this.lockPathFor(filePath);
    try {
      await fsp.unlink(lockPath);
      logger.info(`[FileLockManager] Lock released for ${filePath}`);
    } catch {
      // Lock file doesn't exist — nothing to release
    }
  }

  async getStatus(filePath: string): Promise<AcquireResult> {
    const lockPath = this.lockPathFor(filePath);

    try {
      const raw = await fsp.readFile(lockPath, 'utf-8');
      const lock: LockFileData = JSON.parse(raw);

      if (lock.timestamp + this.staleMs < Date.now()) {
        return { acquired: false };
      }

      return { acquired: true, owner: lock.owner };
    } catch {
      return { acquired: false };
    }
  }

  async releaseStaleLocks(maxAgeMs = DEFAULT_STALE_MS): Promise<void> {
    const now = Date.now();
    try {
      const entries = await fsp.readdir(this.lockDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.startsWith('bmad-lock-')) continue;
        const lockPath = join(this.lockDir, entry.name);
        try {
          const raw = await fsp.readFile(lockPath, 'utf-8');
          const lock: LockFileData = JSON.parse(raw);
          if (now - lock.timestamp > maxAgeMs) {
            await fsp.unlink(lockPath);
            logger.info(`[FileLockManager] Stale lock released: ${entry.name}`);
          }
        } catch {
          try {
            await fsp.unlink(lockPath);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // Lock directory may not exist yet
    }
  }

  private lockPathFor(filePath: string): string {
    const hash = createHash('sha256').update(filePath).digest('hex');
    return join(this.lockDir, `bmad-lock-${hash}.json`);
  }
}

export const fileLockManager = new FileLockManager();
