import { screen, BrowserWindow } from 'electron';
import { getPref, setPref } from './db';

export interface WindowState {
    width: number;
    height: number;
    x: number | undefined;
    y: number | undefined;
    isMaximized: boolean;
}

export const DEFAULT_WINDOW_STATE: WindowState = {
    width: 1280,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false,
};

const PREF_KEY = 'window.state';
const MIN_VISIBLE = 32; // minimum pixels of window that must be on-screen

export interface StateStore {
    getPref(key: string): string | null;
    setPref(key: string, value: string): void;
}

const defaultStore: StateStore = { getPref, setPref };

function isOnScreen(state: WindowState): boolean {
    if (state.x === undefined || state.y === undefined) return false;
    const displays = screen.getAllDisplays();
    return displays.some(
        (d) =>
            state.x! >= d.bounds.x &&
            state.y! >= d.bounds.y &&
            state.x! + MIN_VISIBLE <= d.bounds.x + d.bounds.width &&
            state.y! + MIN_VISIBLE <= d.bounds.y + d.bounds.height,
    );
}

function isValidState(obj: unknown): obj is WindowState {
    if (typeof obj !== 'object' || obj === null) return false;
    const s = obj as Record<string, unknown>;
    return (
        typeof s.width === 'number' &&
        typeof s.height === 'number' &&
        typeof s.isMaximized === 'boolean' &&
        s.width >= 1024 &&
        s.height >= 768 &&
        (s.x === undefined || typeof s.x === 'number') &&
        (s.y === undefined || typeof s.y === 'number')
    );
}

export function loadWindowState(store: StateStore = defaultStore): WindowState {
    try {
        const raw = store.getPref(PREF_KEY);
        if (!raw) return { ...DEFAULT_WINDOW_STATE };

        const parsed = JSON.parse(raw) as unknown;
        if (!isValidState(parsed)) return { ...DEFAULT_WINDOW_STATE };

        if (!isOnScreen(parsed)) {
            return { ...parsed, x: undefined, y: undefined };
        }

        return parsed;
    } catch {
        return { ...DEFAULT_WINDOW_STATE };
    }
}

export function saveWindowState(win: BrowserWindow, store: StateStore = defaultStore): void {
    if (win.isDestroyed()) return;

    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    const state: WindowState = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized,
    };

    try {
        store.setPref(PREF_KEY, JSON.stringify(state));
    } catch {
        // saving state is best-effort; must not crash event handlers
    }
}
