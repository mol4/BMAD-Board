import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ToastProvider, useToast } from './Toast';

afterEach(cleanup);

function ToastConsumer() {
    const { showToast } = useToast();
    return (
        <>
            <button onClick={() => showToast('Saved!', 'success')}>show-success</button>
            <button onClick={() => showToast('Failed!', 'error')}>show-error</button>
        </>
    );
}

describe('Toast system', () => {
    it('throws when used outside ToastProvider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<ToastConsumer />)).toThrow('useToast must be used within ToastProvider');
        spy.mockRestore();
    });

    it('renders a success toast with correct role', async () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>,
        );
        await act(async () => {
            screen.getByText('show-success').click();
        });
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('Saved!')).toBeInTheDocument();
    });

    it('renders an error toast', async () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>,
        );
        await act(async () => {
            screen.getByText('show-error').click();
        });
        expect(screen.getByText('Failed!')).toBeInTheDocument();
    });

    it('dismiss button removes the toast', async () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>,
        );
        await act(async () => {
            screen.getByText('show-success').click();
        });
        const dismiss = screen.getByLabelText('Dismiss notification');
        await act(async () => {
            dismiss.click();
        });
        expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
    });

    it('auto-dismisses a success toast after 4 seconds', async () => {
        vi.useFakeTimers();
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>,
        );
        await act(async () => {
            screen.getByText('show-success').click();
        });
        expect(screen.getByText('Saved!')).toBeInTheDocument();
        await act(async () => {
            vi.advanceTimersByTime(4000);
        });
        expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
        vi.useRealTimers();
    });

    it('auto-dismisses an error toast after 8 seconds', async () => {
        vi.useFakeTimers();
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>,
        );
        await act(async () => {
            screen.getByText('show-error').click();
        });
        expect(screen.getByText('Failed!')).toBeInTheDocument();
        await act(async () => {
            vi.advanceTimersByTime(8000);
        });
        expect(screen.queryByText('Failed!')).not.toBeInTheDocument();
        vi.useRealTimers();
    });

    it('clears pending timers when provider unmounts', async () => {
        vi.useFakeTimers();
        const { unmount } = render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>,
        );
        await act(async () => {
            screen.getByText('show-success').click();
        });
        expect(screen.getByText('Saved!')).toBeInTheDocument();
        unmount();
        // Should not throw or leak when timers fire after unmount
        await act(async () => {
            vi.advanceTimersByTime(4000);
        });
        vi.useRealTimers();
    });

    it('renders multiple stacked toasts', async () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>,
        );
        await act(async () => {
            screen.getByText('show-success').click();
        });
        await act(async () => {
            screen.getByText('show-error').click();
        });
        const statuses = screen.getAllByRole('status');
        expect(statuses).toHaveLength(2);
        expect(screen.getByText('Saved!')).toBeInTheDocument();
        expect(screen.getByText('Failed!')).toBeInTheDocument();
    });
});
