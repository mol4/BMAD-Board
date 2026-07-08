import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import { useSyncAria, AriaLiveRegion, getGlobalAriaMessage, setGlobalAriaMessage } from '@/hooks/useSyncAria';

let onStartCallbacks: Array<() => void> = [];
let onCompleteCallbacks: Array<() => void> = [];
let onErrorCallbacks: Array<(err: Error) => void> = [];

vi.mock('@/lib/sync-engine', () => ({
  syncEngine: {
    processChanges: vi.fn().mockResolvedValue(undefined),
    forceFullSync: vi.fn().mockResolvedValue(undefined),
    addEventListener(event: string, cb: () => void) {
      if (event === 'start') onStartCallbacks.push(cb);
      if (event === 'complete') onCompleteCallbacks.push(cb);
      return () => {
        if (event === 'start') onStartCallbacks = onStartCallbacks.filter((f) => f !== cb);
        if (event === 'complete') onCompleteCallbacks = onCompleteCallbacks.filter((f) => f !== cb);
      };
    },
    addErrorListener(cb: (err: Error) => void) {
      onErrorCallbacks.push(cb);
      return () => {
        onErrorCallbacks = onErrorCallbacks.filter((f) => f !== cb);
      };
    },
    get syncing() { return false; },
  },
}));

function fireSyncStart() {
  onStartCallbacks.forEach((cb) => cb());
}

function fireSyncComplete() {
  onCompleteCallbacks.forEach((cb) => cb());
}

function fireSyncError(err: Error = new Error('sync failed')) {
  onErrorCallbacks.forEach((cb) => cb(err));
}

function Probe() {
  useSyncAria();
  return null;
}

describe('useSyncAria', () => {
  beforeEach(() => {
    cleanup();
    onStartCallbacks = [];
    onCompleteCallbacks = [];
    onErrorCallbacks = [];
    setGlobalAriaMessage('');
  });

  it('registers start and complete listeners on mount', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(onStartCallbacks.length).toBe(1);
    expect(onCompleteCallbacks.length).toBe(1);
    expect(onErrorCallbacks.length).toBe(1);
  });

  it('unsubscribes listeners on unmount', () => {
    const { unmount } = render(<I18nProvider><Probe /></I18nProvider>);
    expect(onStartCallbacks.length).toBe(1);
    unmount();
    expect(onStartCallbacks.length).toBe(0);
    expect(onCompleteCallbacks.length).toBe(0);
    expect(onErrorCallbacks.length).toBe(0);
  });

  it('sets aria message on sync start', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    fireSyncStart();
    expect(getGlobalAriaMessage()).toBe('Syncing file changes');
  });

  it('sets aria message on sync complete', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    fireSyncStart();
    fireSyncComplete();
    expect(getGlobalAriaMessage()).toBe('Sync complete');
  });

  it('sets aria message on sync error', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    fireSyncError();
    expect(getGlobalAriaMessage()).toBe('Sync failed. Check file paths.');
  });
});

describe('AriaLiveRegion', () => {
  beforeEach(() => {
    cleanup();
    onStartCallbacks = [];
    onCompleteCallbacks = [];
    onErrorCallbacks = [];
    setGlobalAriaMessage('');
  });

  it('renders with sr-only class and aria-live polite', () => {
    render(<AriaLiveRegion />);
    const el = document.querySelector('[aria-live="polite"]');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('sr-only');
    expect(el).toHaveAttribute('aria-atomic', 'true');
  });

  it('updates message when globalAriaMessage changes', async () => {
    render(<AriaLiveRegion />);
    const el = document.querySelector('[aria-live="polite"]')!;

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await act(async () => {
      fireSyncStart();
    });
    expect(el.textContent).toBe('Syncing file changes');

    await act(async () => {
      fireSyncComplete();
    });
    expect(el.textContent).toBe('Sync complete');
  });
});
