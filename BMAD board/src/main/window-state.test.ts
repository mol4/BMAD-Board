import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadWindowState, saveWindowState, DEFAULT_WINDOW_STATE } from './window-state';
import type { StateStore, WindowState } from './window-state';

// Mock electron's screen module
vi.mock('electron', () => ({
    screen: {
        getAllDisplays: () => [
            {
                bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            },
        ],
    },
}));

function makeMockStore(initialPrefs: Record<string, string> = {}): StateStore {
    const data: Record<string, string> = { ...initialPrefs };
    return {
        getPref: (key: string) => data[key] ?? null,
        setPref: (key: string, value: string) => {
            data[key] = value;
        },
    };
}

describe('loadWindowState', () => {
    it('returns DEFAULT_WINDOW_STATE when preferences table is empty', () => {
        const store = makeMockStore();
        const state = loadWindowState(store);
        expect(state).toEqual(DEFAULT_WINDOW_STATE);
    });

    it('returns saved state when window.state preference exists and is on screen', () => {
        const saved: WindowState = {
            width: 1400,
            height: 900,
            x: 100,
            y: 50,
            isMaximized: false,
        };
        const store = makeMockStore({ 'window.state': JSON.stringify(saved) });
        const state = loadWindowState(store);
        expect(state).toEqual(saved);
    });

    it('falls back to defaults when stored JSON is malformed', () => {
        const store = makeMockStore({ 'window.state': 'not-valid-json{{{' });
        const state = loadWindowState(store);
        expect(state).toEqual(DEFAULT_WINDOW_STATE);
    });

    it('falls back to defaults when stored JSON has wrong shape', () => {
        const store = makeMockStore({ 'window.state': JSON.stringify({ foo: 'bar' }) });
        const state = loadWindowState(store);
        expect(state).toEqual(DEFAULT_WINDOW_STATE);
    });

    it('resets x/y to undefined when saved position is off-screen', () => {
        const offScreen: WindowState = {
            width: 1280,
            height: 800,
            x: 9999,
            y: 9999,
            isMaximized: false,
        };
        const store = makeMockStore({ 'window.state': JSON.stringify(offScreen) });
        const state = loadWindowState(store);
        expect(state.x).toBeUndefined();
        expect(state.y).toBeUndefined();
        expect(state.width).toBe(1280);
        expect(state.height).toBe(800);
    });
});

describe('saveWindowState', () => {
    it('calls setPref with window.state key and serialized bounds', () => {
        const store = makeMockStore();
        const setPrefSpy = vi.spyOn(store, 'setPref');

        const mockWin = {
            isDestroyed: () => false,
            getBounds: () => ({ x: 0, y: 0, width: 1920, height: 1080 }), // maximized screen bounds (not used)
            getNormalBounds: () => ({ x: 200, y: 100, width: 1600, height: 1000 }), // normal bounds (used when maximized)
            isMaximized: () => true,
        } as unknown as import('electron').BrowserWindow;

        saveWindowState(mockWin, store);

        expect(setPrefSpy).toHaveBeenCalledOnce();
        const [key, value] = setPrefSpy.mock.calls[0];
        expect(key).toBe('window.state');
        const parsed = JSON.parse(value) as WindowState;
        expect(parsed).toEqual({
            x: 200,
            y: 100,
            width: 1600,
            height: 1000,
            isMaximized: true,
        });
    });

    it('does not call setPref if window is destroyed', () => {
        const store = makeMockStore();
        const setPrefSpy = vi.spyOn(store, 'setPref');

        const mockWin = {
            isDestroyed: () => true,
            getBounds: () => ({ x: 0, y: 0, width: 1280, height: 800 }),
            isMaximized: () => false,
        } as unknown as import('electron').BrowserWindow;

        saveWindowState(mockWin, store);
        expect(setPrefSpy).not.toHaveBeenCalled();
    });
});
