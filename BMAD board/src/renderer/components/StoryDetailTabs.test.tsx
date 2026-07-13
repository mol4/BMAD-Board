import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import StoryDetailTabs from './StoryDetailTabs';

vi.mock('marked', () => ({
  default: {
    setOptions: vi.fn(),
    parse: vi.fn((md: string) => `<p>${md}</p>`),
    parseInline: vi.fn((md: string) => md),
  },
  marked: {
    setOptions: vi.fn(),
    parse: vi.fn((md: string) => `<p>${md}</p>`),
    parseInline: vi.fn((md: string) => md),
  },
}));

function createTestStory() {
  const store = useAppStore.getState();
  const epic = store.createEpic({ title: 'Test Epic', description: '' });
  const story = store.createStory({
    epicId: epic.id,
    title: 'Test Story',
    description: 'Story description',
    acceptanceCriteria: ['AC 1', 'AC 2'],
  });
  return { epic, story };
}

function renderTabs(props?: Partial<React.ComponentProps<typeof StoryDetailTabs>>) {
  const { story } = createTestStory();
  const defaultProps = {
    story,
    rawMarkdown: null as string | null,
    onOpenMdModal: vi.fn(),
    onLoadMarkdown: vi.fn(),
    ...props,
  };
  return {
    ...render(
      <MemoryRouter>
        <I18nProvider>
          <StoryDetailTabs {...defaultProps} />
        </I18nProvider>
      </MemoryRouter>,
    ),
    onOpenMdModal: defaultProps.onOpenMdModal,
  };
}

describe('StoryDetailTabs', () => {
  beforeEach(() => {
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
    localStorage.clear();
  });

  it('renders Info and Markdown tabs', () => {
    renderTabs();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });

  it('defaults to Info tab', () => {
    renderTabs();
    expect(screen.getByText('Story description')).toBeInTheDocument();
  });

  it('switches to Markdown tab on click', () => {
    renderTabs({ rawMarkdown: '# Hello' });
    fireEvent.click(screen.getByText('Markdown'));
    expect(screen.getByText('Rendered')).toBeInTheDocument();
    expect(screen.getByText('Raw')).toBeInTheDocument();
  });

  it('shows "No markdown content" when rawMarkdown is null', () => {
    renderTabs({ rawMarkdown: null });
    fireEvent.click(screen.getByText('Markdown'));
    expect(screen.getByText('No markdown content')).toBeInTheDocument();
  });

  it('renders acceptance criteria in Info tab', () => {
    renderTabs();
    expect(screen.getByText('AC 1')).toBeInTheDocument();
    expect(screen.getByText('AC 2')).toBeInTheDocument();
  });

  it('renders epic title as plain text (not a link)', () => {
    renderTabs();
    const epicLabel = screen.getByText('Test Epic');
    expect(epicLabel.tagName).not.toBe('A');
    expect(epicLabel.closest('a')).toBeNull();
  });

  it('switches between rendered and raw views', () => {
    renderTabs({ rawMarkdown: '# Hello World' });
    fireEvent.click(screen.getByText('Markdown'));
    fireEvent.click(screen.getByText('Raw'));
    expect(screen.getByText('# Hello World')).toBeInTheDocument();
  });

  it('shows pencil icon in Markdown tab when story has sourceFile', () => {
    const { story } = createTestStory();
    const store = useAppStore.getState();
    store.updateStory(story.id, { sourceFile: '/test/story.md' });

    renderTabs({ story: { ...story, sourceFile: '/test/story.md' } });
    fireEvent.click(screen.getByText('Markdown'));
    const editBtn = screen.getByTitle('Edit');
    expect(editBtn).toBeInTheDocument();
  });

  it('shows EditWarningDialog when pencil clicked and not dismissed', () => {
    const { story } = createTestStory();
    const store = useAppStore.getState();
    store.updateStory(story.id, { sourceFile: '/test/story.md' });

    renderTabs({ story: { ...story, sourceFile: '/test/story.md' } });
    fireEvent.click(screen.getByText('Markdown'));
    fireEvent.click(screen.getByTitle('Edit'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/You are about to edit/i)).toBeInTheDocument();
  });

  it('calls onOpenMdModal when EditWarningDialog confirmed', () => {
    const { story } = createTestStory();
    const store = useAppStore.getState();
    store.updateStory(story.id, { sourceFile: '/test/story.md' });

    const { onOpenMdModal } = renderTabs({ story: { ...story, sourceFile: '/test/story.md' } });
    fireEvent.click(screen.getByText('Markdown'));
    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.click(screen.getByText('Continue'));

    expect(onOpenMdModal).toHaveBeenCalled();
  });

  it('skips EditWarningDialog when dontShowAgain is set in localStorage', () => {
    localStorage.setItem('bmad-board-hide-edit-warning', 'true');
    const { story } = createTestStory();
    const store = useAppStore.getState();
    store.updateStory(story.id, { sourceFile: '/test/story.md' });

    const { onOpenMdModal } = renderTabs({ story: { ...story, sourceFile: '/test/story.md' } });
    fireEvent.click(screen.getByText('Markdown'));
    fireEvent.click(screen.getByTitle('Edit'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onOpenMdModal).toHaveBeenCalled();
  });
});
