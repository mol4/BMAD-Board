import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import EditWarningDialog, { isEditWarningDismissedForSession, dismissEditWarningForSession } from './EditWarningDialog';

afterEach(cleanup);

function renderDialog(props: Partial<{
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    dontShowAgain: boolean;
    onDontShowAgainChange: (value: boolean) => void;
}> = {}) {
    return render(
        <I18nProvider>
            <EditWarningDialog
                isOpen={props.isOpen ?? true}
                onConfirm={props.onConfirm ?? vi.fn()}
                onCancel={props.onCancel ?? vi.fn()}
                dontShowAgain={props.dontShowAgain ?? false}
                onDontShowAgainChange={props.onDontShowAgainChange ?? vi.fn()}
            />
        </I18nProvider>,
    );
}

describe('EditWarningDialog', () => {
    it('renders warning text, confirm and cancel buttons when open', () => {
        renderDialog();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/edit.*file.*manually/i)).toBeInTheDocument();
        expect(screen.getByText(/Continue|Продолжить/i)).toBeInTheDocument();
        expect(screen.getByText(/Cancel|Отмена/i)).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });
        fireEvent.click(screen.getByText(/Continue|Продолжить/i));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        renderDialog({ onCancel });
        fireEvent.click(screen.getByText(/Cancel|Отмена/i));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onDontShowAgainChange when checkbox is toggled', () => {
        const onDontShowAgainChange = vi.fn();
        renderDialog({ onDontShowAgainChange });
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(onDontShowAgainChange).toHaveBeenCalledWith(true);
    });

    it('calls onCancel when Escape is pressed', () => {
        const onCancel = vi.fn();
        renderDialog({ onCancel });
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
        renderDialog({ isOpen: false });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('checkbox reflects dontShowAgain prop', () => {
        renderDialog({ dontShowAgain: true });
        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    it('per-session dismissal functions work correctly', () => {
        expect(isEditWarningDismissedForSession()).toBe(false);
        dismissEditWarningForSession();
        expect(isEditWarningDismissedForSession()).toBe(true);
    });
});
