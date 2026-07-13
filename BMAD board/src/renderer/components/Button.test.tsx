import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders children', () => {
    render(<Button>Click</Button>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('renders primary variant by default', () => {
    render(<Button data-testid="btn">x</Button>);
    const el = screen.getByTestId('btn');
    expect(el.className).toContain('bg-accent');
    expect(el.className).toContain('text-foreground-on-accent');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary" data-testid="btn">x</Button>);
    const el = screen.getByTestId('btn');
    expect(el.className).toContain('bg-surface-sunken');
    expect(el.className).toContain('border-border-default');
  });

  it('applies disabled styles', () => {
    render(<Button disabled data-testid="btn">x</Button>);
    const el = screen.getByTestId('btn') as HTMLButtonElement;
    expect(el.disabled).toBe(true);
    expect(el.className).toContain('disabled:opacity-50');
    expect(el.className).toContain('disabled:pointer-events-none');
  });

  it('uses type="button" by default', () => {
    render(<Button data-testid="btn">x</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('type', 'button');
  });

  it('calls onClick', () => {
    const fn = vi.fn();
    render(<Button onClick={fn} data-testid="btn">x</Button>);
    fireEvent.click(screen.getByTestId('btn'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('renders iconLeft and iconRight', () => {
    render(<Button iconLeft={<span>L</span>} iconRight={<span>R</span>} data-testid="btn">Mid</Button>);
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('Mid')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });
});
