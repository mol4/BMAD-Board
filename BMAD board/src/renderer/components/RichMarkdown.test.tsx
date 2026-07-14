import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import RichMarkdown from '@/components/RichMarkdown';

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));
const { mockRendererCode } = vi.hoisted(() => ({ mockRendererCode: vi.fn() }));

vi.mock('marked', () => {
  const Renderer = vi.fn().mockImplementation(function (this: { code: typeof mockRendererCode }) {
    this.code = mockRendererCode;
    return this;
  });
  return {
    default: { parse: mockParse, Renderer },
    marked: { parse: mockParse, Renderer },
    Renderer,
  };
});

vi.mock('@/lib/highlighter', () => ({
  highlightCode: vi.fn().mockResolvedValue('<pre><code>highlighted</code></pre>'),
}));

vi.mock('@/components/MermaidRenderer', () => ({
  default: ({ code }: { code: string }) => <div data-testid="mermaid-renderer">{code}</div>,
}));

afterEach(cleanup);

function setDarkClass(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

describe('RichMarkdown', () => {
  beforeEach(() => {
    setDarkClass(true);
    vi.clearAllMocks();
  });

  it('renders markdown content via marked', async () => {
    mockParse.mockReturnValue('<p>Hello World</p>');
    mockRendererCode.mockReturnValue('<div data-cb-id="cb-0"></div>');

    render(<RichMarkdown markdown="Hello World" />);

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton before render completes', () => {
    mockParse.mockImplementation(() => new Promise(() => {}));
    render(<RichMarkdown markdown="Loading..." />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('applies className prop to wrapper', async () => {
    mockParse.mockReturnValue('<p>text</p>');
    mockRendererCode.mockReturnValue('<div data-cb-id="cb-0"></div>');

    render(<RichMarkdown markdown="text" className="prose custom-class" />);

    await waitFor(() => {
      const wrapper = document.querySelector('.prose.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  it('reacts to theme changes via MutationObserver', async () => {
    mockParse.mockReturnValue('<p>text</p>');
    mockRendererCode.mockReturnValue('<div data-cb-id="cb-0"></div>');

    const { rerender } = render(<RichMarkdown markdown="text" />);

    await waitFor(() => {
      expect(screen.getByText('text')).toBeInTheDocument();
    });

    const callsBeforeSwitch = mockParse.mock.calls.length;
    setDarkClass(false);
    rerender(<RichMarkdown markdown="text" />);

    await waitFor(() => {
      expect(mockParse.mock.calls.length).toBeGreaterThan(callsBeforeSwitch);
    });
  });
});
