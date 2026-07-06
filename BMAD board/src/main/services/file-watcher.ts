import { watch, type FSWatcher as NodeFSWatcher } from 'fs';
import { stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import chokidar, { type FSWatcher as ChokidarFSWatcher } from 'chokidar';
import logger from '../logger';
import type {
  WatcherChange,
  WatcherChangeType,
  WatcherErrorPayload,
  WatcherStatus,
  FileChangedPayload,
} from '../../shared/ipc-channels';

export type { WatcherChangeType, WatcherErrorPayload, WatcherStatus, FileChangedPayload };
export type PendingChange = WatcherChange;

export interface FileWatcherEmit {
  fileChanged: (payload: FileChangedPayload) => void;
  watcherError: (payload: WatcherErrorPayload) => void;
}

export interface FileWatcherOptions {
  emit: FileWatcherEmit;
  debounceMs?: number;
  lockRetryMs?: number;
  preferFallback?: boolean;
  platform?: typeof process.platform;
}

type AnyWatcher = NodeFSWatcher | ChokidarFSWatcher;

interface WatchedRoot {
  dir: string;
  watcher: AnyWatcher;
  fallback: boolean;
}

const LOCK_ERRORS = new Set(['EBUSY', 'EPERM', 'EACCES']);
const DEFAULT_DEBOUNCE_MS = 30000;
const DEFAULT_LOCK_RETRY_MS = 5000;
const CHOKIDAR_POLLING_INTERVAL_MS = 1000;

export class FileWatcher {
  private readonly emit: FileWatcherEmit;
  private readonly debounceMs: number;
  private readonly lockRetryMs: number;
  private readonly preferFallback: boolean;
  private readonly isMacos: boolean;

  private roots = new Map<string, WatchedRoot>();
  private pending = new Map<string, PendingChange>();
  private knownPaths = new Set<string>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private livenessTimer: ReturnType<typeof setInterval> | null = null;
  private lockRetryTimers: Set<ReturnType<typeof setTimeout>> = new Set();
  private fallbackActivated = false;

  constructor(options: FileWatcherOptions) {
    this.emit = options.emit;
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.lockRetryMs = options.lockRetryMs ?? DEFAULT_LOCK_RETRY_MS;
    this.preferFallback = options.preferFallback ?? false;
    const platform = options.platform ?? process.platform;
    this.isMacos = platform === 'darwin';
  }

  start(dirs: string[]): void {
    this.stop();
    if (dirs.length === 0) {
      logger.info('[FileWatcher] start called with no dirs — nothing to watch');
      return;
    }
    const uniqueDirs = Array.from(new Set(dirs));
    for (const dir of uniqueDirs) {
      this.startRoot(dir);
    }
    this.startLivenessCheck();
  }

  stop(): void {
    const dirs = Array.from(this.roots.keys());
    for (const dir of dirs) {
      const root = this.roots.get(dir);
      if (!root) continue;
      this.roots.delete(dir);
      try {
        const closeResult = root.watcher.close();
        if (closeResult && typeof closeResult.catch === 'function') {
          closeResult.catch((err) => {
            logger.error(`[FileWatcher] error closing watcher for ${dir}:`, err);
          });
        }
      } catch (err) {
        logger.error(`[FileWatcher] error closing watcher for ${dir}:`, err);
      }
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.livenessTimer) {
      clearInterval(this.livenessTimer);
      this.livenessTimer = null;
    }
    for (const timer of this.lockRetryTimers) {
      clearTimeout(timer);
    }
    this.lockRetryTimers.clear();
    this.pending.clear();
    this.knownPaths.clear();
    this.fallbackActivated = false;
    logger.info('[FileWatcher] stopped');
  }

  getStatus(): WatcherStatus {
    return {
      active: this.roots.size > 0,
      dirs: Array.from(this.roots.keys()),
      fallback: this.fallbackActivated,
      pendingCount: this.pending.size,
    };
  }

  private startRoot(dir: string): void {
    const useFallback = this.preferFallback || this.isMacos;
    if (useFallback) {
      this.startChokidar(dir);
      return;
    }
    try {
      const watcher = watch(dir, { recursive: true }, (eventType, filename) => {
        if (!this.roots.has(dir)) return;
        if (!existsSync(dir)) {
          this.handleRootLost(dir);
          return;
        }
        if (!filename) return;
        const fullPath = join(dir, filename.toString());
        this.handleEvent(dir, fullPath, undefined).catch((err) => {
          logger.error(`[FileWatcher] handle error for ${fullPath}:`, err);
        });
      });
      watcher.on('error', (err) => {
        logger.error(`[FileWatcher] fs.watch error for ${dir}:`, err);
        this.checkRootLost(dir);
      });
      watcher.on('close', () => {
        if (this.roots.has(dir) && !existsSync(dir)) {
          this.handleRootLost(dir);
        }
      });
      this.roots.set(dir, { dir, watcher, fallback: false });
      logger.info(`[FileWatcher] watching ${dir} (mode: fs.watch)`);
    } catch (err) {
      logger.warn(`[FileWatcher] fs.watch unavailable for ${dir}, falling back to chokidar:`, err);
      this.startChokidar(dir);
    }
  }

  private startChokidar(dir: string): void {
    const watcher = chokidar.watch(dir, {
      usePolling: true,
      interval: CHOKIDAR_POLLING_INTERVAL_MS,
      ignoreInitial: true,
    });
    watcher.on('all', (event, path) => {
      if (!this.roots.has(dir)) return;
      if (event === 'unlinkDir' && path === dir) {
        this.handleRootLost(dir);
        return;
      }
      if (event === 'addDir') return;
      let type: WatcherChangeType;
      if (event === 'add') type = 'created';
      else if (event === 'change') type = 'modified';
      else if (event === 'unlink') type = 'deleted';
      else return;
      this.handleEvent(dir, path, type).catch((err) => {
        logger.error(`[FileWatcher] chokidar handle error for ${path}:`, err);
      });
    });
    watcher.on('error', (err) => {
      logger.error(`[FileWatcher] chokidar error for ${dir}:`, err);
      this.checkRootLost(dir);
    });
    this.roots.set(dir, { dir, watcher, fallback: true });
    this.fallbackActivated = true;
    logger.info(`[FileWatcher] watching ${dir} (mode: chokidar polling @${CHOKIDAR_POLLING_INTERVAL_MS}ms)`);
  }

  private async handleEvent(
    dir: string,
    fullPath: string,
    hintType: WatcherChangeType | undefined,
    attempt = 0,
  ): Promise<void> {
    if (!this.roots.has(dir)) return;
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) return;
      let type: WatcherChangeType;
      if (hintType) {
        type = hintType;
      } else {
        type = this.knownPaths.has(fullPath) ? 'modified' : 'created';
      }
      this.knownPaths.add(fullPath);
      this.scheduleChange(fullPath, type, stats.mtimeMs);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === 'ENOENT') {
        this.knownPaths.delete(fullPath);
        this.scheduleChange(fullPath, 'deleted', 0);
        return;
      }
      if (code && LOCK_ERRORS.has(code)) {
        if (attempt === 0) {
          const timer = setTimeout(() => {
            this.lockRetryTimers.delete(timer);
            this.handleEvent(dir, fullPath, hintType, 1).catch((retryErr) => {
              logger.error(`[FileWatcher] retry failed for ${fullPath}:`, retryErr);
              this.emit.watcherError({
                code: 'FILE_LOCKED',
                message: `File locked by another process: ${fullPath}`,
                path: fullPath,
              });
            });
          }, this.lockRetryMs);
          this.lockRetryTimers.add(timer);
          logger.warn(`[FileWatcher] lock error on ${fullPath}, retrying in ${this.lockRetryMs}ms`);
          return;
        }
        this.emit.watcherError({
          code: 'FILE_LOCKED',
          message: `File locked by another process: ${fullPath}`,
          path: fullPath,
        });
        return;
      }
      logger.error(`[FileWatcher] unexpected error handling ${fullPath}:`, err);
      this.emit.watcherError({
        code: 'WATCHER_ERROR',
        message: String(err),
        path: fullPath,
      });
    }
  }

  private scheduleChange(path: string, type: WatcherChangeType, mtimeMs: number): void {
    const existing = this.pending.get(path);
    if (existing && existing.type === type && existing.mtimeMs === mtimeMs) {
      return;
    }
    this.pending.set(path, { path, type, mtimeMs });
    this.resetDebounceTimer();
  }

  private resetDebounceTimer(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), this.debounceMs);
  }

  private flush(): void {
    this.debounceTimer = null;
    if (this.pending.size === 0) return;
    const changes = Array.from(this.pending.values());
    this.pending.clear();
    logger.info(`[FileWatcher] emitting file:changed with ${changes.length} change(s)`);
    this.emit.fileChanged({ changes });
  }

  private startLivenessCheck(): void {
    const intervalMs = Math.max(1000, Math.min(this.debounceMs, 5000));
    this.livenessTimer = setInterval(() => {
      for (const dir of Array.from(this.roots.keys())) {
        this.checkRootLost(dir);
      }
    }, intervalMs);
  }

  private checkRootLost(dir: string): void {
    if (!this.roots.has(dir)) return;
    if (!existsSync(dir)) {
      this.handleRootLost(dir);
    }
  }

  private handleRootLost(dir: string): void {
    const root = this.roots.get(dir);
    if (!root) return;
    this.roots.delete(dir);
    try {
      const closeResult = root.watcher.close();
      if (closeResult && typeof closeResult.catch === 'function') {
        closeResult.catch((err) => {
          logger.error(`[FileWatcher] error closing lost root watcher for ${dir}:`, err);
        });
      }
    } catch (err) {
      logger.error(`[FileWatcher] error closing lost root watcher for ${dir}:`, err);
    }
    for (const [path] of this.pending) {
      if (path.startsWith(dir)) {
        this.pending.delete(path);
      }
    }
    logger.warn(`[FileWatcher] watched directory lost: ${dir}`);
    this.emit.watcherError({
      code: 'WATCH_DIR_LOST',
      message: `Watched directory no longer accessible: ${dir}`,
      path: dir,
    });
  }
}
