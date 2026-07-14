import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const mockRender = vi.fn();
const mockInitialize = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    render: mockRender,
    initialize: mockInitialize,
  },
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'mermaid.loading': 'Loading diagram',
        'mermaid.renderError': 'Diagram rendering failed',
      };
      return map[key] || key;
    },
  }),
}));

let MermaidRenderer: React.ComponentType<{ code: string; isDark: boolean }>;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('@/components/MermaidRenderer');
  MermaidRenderer = mod.default;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MermaidRenderer', () => {
  it('shows skeleton placeholder while loading', () => {
    mockRender.mockImplementation(() => new Promise(() => {}));
    render(<MermaidRenderer code="graph TD; A-->B;" isDark={true} />);
    expect(screen.getByRole('img', { name: 'Loading diagram' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Loading diagram' })).toHaveAttribute('aria-busy', 'true');
  });

  it('renders SVG after mermaid completes', async () => {
    mockRender.mockResolvedValue({ svg: '<svg>test</svg>' });
    render(<MermaidRenderer code="graph TD" isDark={true} />);

    await waitFor(() => {
      expect(screen.getByText('mermaid')).toBeInTheDocument();
    });

    const container = screen.getByRole('img', { name: 'Mermaid diagram' });
    expect(container).toBeInTheDocument();
    expect(container.innerHTML).toContain('<svg>test</svg>');
  });

  it('shows error fallback on render failure', async () => {
    mockRender.mockRejectedValue(new Error('Parse error'));
    render(<MermaidRenderer code="invalid" isDark={true} />);

    await waitFor(() => {
      expect(screen.getByText('Diagram rendering failed')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });

  it('passes dark theme variables to mermaid.initialize', async () => {
    mockRender.mockResolvedValue({ svg: '<svg>test</svg>' });
    render(<MermaidRenderer code="graph TD" isDark={true} />);

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    const call = mockInitialize.mock.calls[0][0];
    expect(call.theme).toBe('base');
    expect(call.themeVariables.primaryColor).toBe('#2DD4BF');
    expect(call.startOnLoad).toBe(false);
  });

  it('passes light theme variables to mermaid.initialize', async () => {
    mockRender.mockResolvedValue({ svg: '<svg>test</svg>' });
    render(<MermaidRenderer code="graph TD" isDark={false} />);

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    const call = mockInitialize.mock.calls[0][0];
    expect(call.themeVariables.primaryColor).toBe('#0D9488');
  });

  it('has language badge with correct styling', async () => {
    mockRender.mockResolvedValue({ svg: '<svg>test</svg>' });
    render(<MermaidRenderer code="graph TD" isDark={true} />);

    await waitFor(() => {
      expect(screen.getByText('mermaid')).toBeInTheDocument();
    });

    const badge = screen.getByText('mermaid');
    expect(badge.className).toContain('text-foreground-tertiary');
  });

  it('sets SVG background based on theme', async () => {
    mockRender.mockResolvedValue({ svg: '<svg>test</svg>' });
    const { rerender } = render(<MermaidRenderer code="graph TD" isDark={true} />);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Mermaid diagram' })).toBeInTheDocument();
    });

    rerender(<MermaidRenderer code="graph TD" isDark={false} />);
    await waitFor(() => {
      const div = screen.getByRole('img', { name: 'Mermaid diagram' }).querySelector('div');
      expect(div?.style.backgroundColor).toBe('rgb(255, 255, 255)');
    });
  });
});
