import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent, act } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';
import MarkdownModal from './MarkdownModal';

const { setOptionsMock, parseMock } = vi.hoisted(() => ({
    setOptionsMock: vi.fn(),
    parseMock: vi.fn(),
}));

vi.mock('marked', () => ({
    default: {
        setOptions: setOptionsMock,
        parse: parseMock,
        Renderer: vi.fn().mockImplementation(() => ({
            code: vi.fn(),
        })),
    },
    marked: {
        setOptions: setOptionsMock,
        parse: parseMock,
        Renderer: vi.fn().mockImplementation(() => ({
            code: vi.fn(),
        })),
    },
}));

vi.mock('@/components/RichMarkdown', () => ({
    default: ({ markdown, className }: { markdown: string; className?: string }) => (
        <div className={className} data-testid="rich-markdown">{markdown}</div>
    ),
}));

vi.mock('gray-matter', () => ({
    default: vi.fn((content: string) => {
        if (content.includes('broken: [')) {
            throw new Error('Invalid YAML');
        }
        return { data: {}, content: '' };
    }),
}));

afterEach(cleanup);

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Title',
    markdownContent: '# Hello',
    filePath: '/test/file.md' as string | undefined,
    editable: false as boolean,
    onSave: undefined as ((content: string) => Promise<void>) | undefined,
};

function renderModal(props: Partial<typeof defaultProps> = {}) {
    const merged = { ...defaultProps, ...props };
    return render(
        <I18nProvider>
            <ToastProvider>
                <MarkdownModal
                    isOpen={merged.isOpen}
                    onClose={merged.onClose}
                    title={merged.title}
                    markdownContent={merged.markdownContent}
                    filePath={merged.filePath}
                    editable={merged.editable}
                    onSave={merged.onSave}
                />
            </ToastProvider>
        </I18nProvider>,
    );
}

describe('MarkdownModal', () => {
    beforeEach(() => {
        parseMock.mockReturnValue('<p>Hello</p>');
    });

    it('renders title and close button when open', () => {
        renderModal();
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        renderModal({ isOpen: false });
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    it('renders HTML from parsed markdown', async () => {
        parseMock.mockReturnValue('<p>Rendered content</p>');
        renderModal();
        await waitFor(() => {
            expect(screen.getByTestId('rich-markdown')).toBeInTheDocument();
        });
    });

    it('calls onClose when Escape is pressed', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows edit button when editable and filePath are provided', () => {
        renderModal({ editable: true, filePath: '/test/file.md' });
        expect(screen.getByLabelText(/Edit|Редактировать/i)).toBeInTheDocument();
    });

    it('does not show edit button when editable is false', () => {
        renderModal({ editable: false, filePath: '/test/file.md' });
        expect(screen.queryByLabelText(/Edit|Редактировать/i)).not.toBeInTheDocument();
    });

    it('does not show edit button when filePath is absent', () => {
        renderModal({ editable: true, filePath: undefined });
        expect(screen.queryByLabelText(/Edit|Редактировать/i)).not.toBeInTheDocument();
    });

    it('opens warning dialog when edit button is clicked and session not dismissed', async () => {
        renderModal({ editable: true, filePath: '/test/file.md' });
        fireEvent.click(screen.getByLabelText(/Edit|Редактировать/i));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('enters edit mode after confirming warning', async () => {
        renderModal({ editable: true, filePath: '/test/file.md' });
        fireEvent.click(screen.getByLabelText(/Edit|Редактировать/i));
        fireEvent.click(screen.getByText(/Continue|Продолжить/i));
        const textarea = screen.getByRole('textbox');
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveValue('# Hello');
    });

    it('shows save and cancel buttons in edit mode', async () => {
        renderModal({ editable: true, filePath: '/test/file.md' });
        fireEvent.click(screen.getByLabelText(/Edit|Редактировать/i));
        fireEvent.click(screen.getByText(/Continue|Продолжить/i));
        expect(screen.getByText(/Save|Сохранить/i)).toBeInTheDocument();
        const cancelButtons = screen.getAllByText(/Cancel|Отмена/i);
        expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('returns to view mode when cancel is clicked in edit mode', async () => {
        renderModal({ editable: true, filePath: '/test/file.md' });
        fireEvent.click(screen.getByLabelText(/Edit|Редактировать/i));
        fireEvent.click(screen.getByText(/Continue|Продолжить/i));
        const cancelButtons = screen.getAllByText(/Cancel|Отмена/i);
        fireEvent.click(cancelButtons[0]);
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('calls onSave when save is clicked with valid frontmatter', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderModal({
            editable: true,
            filePath: '/test/file.md',
            markdownContent: '---\ntitle: Test\n---\n\n# Body',
            onSave,
        });
        fireEvent.click(screen.getByLabelText(/Edit|Редактировать/i));
        fireEvent.click(screen.getByText(/Continue|Продолжить/i));
        await act(async () => {
            fireEvent.click(screen.getByText(/Save|Сохранить/i));
        });
        await waitFor(() => {
            expect(onSave).toHaveBeenCalledTimes(1);
            expect(onSave).toHaveBeenCalledWith('---\ntitle: Test\n---\n\n# Body');
        });
    });

    it('blocks save with invalid frontmatter', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        renderModal({
            editable: true,
            filePath: '/test/file.md',
            markdownContent: '---\nbroken: [\n---\n\n# Body',
            onSave,
        });
        fireEvent.click(screen.getByLabelText(/Edit|Редактировать/i));
        fireEvent.click(screen.getByText(/Continue|Продолжить/i));
        await act(async () => {
            fireEvent.click(screen.getByText(/Save|Сохранить/i));
        });
        await waitFor(() => {
            expect(screen.queryByRole('textbox')).toBeInTheDocument();
        });
        expect(onSave).not.toHaveBeenCalled();
    });

    it('Escape in edit mode returns to view mode without closing modal', () => {
        const onClose = vi.fn();
        renderModal({ editable: true, filePath: '/test/file.md', onClose });
        fireEvent.click(screen.getByLabelText(/Edit|Редактировать/i));
        fireEvent.click(screen.getByText(/Continue|Продолжить/i));
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
});
