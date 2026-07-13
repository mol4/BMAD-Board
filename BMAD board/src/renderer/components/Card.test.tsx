import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders children', () => {
    render(<Card>hello</Card>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Card data-testid="card">x</Card>);
    const el = screen.getByTestId('card');
    expect(el.className).toContain('bg-surface-elevated');
    expect(el.className).toContain('border-border-default');
    expect(el.className).toContain('rounded-lg');
    expect(el.className).toContain('shadow-card');
  });

  it('applies hover classes when hoverable (default)', () => {
    render(<Card data-testid="card">x</Card>);
    const el = screen.getByTestId('card');
    expect(el.className).toContain('hover:shadow-card-hover');
    expect(el.className).toContain('hover:-translate-y-px');
  });

  it('does not apply hover classes when hoverable=false', () => {
    render(<Card hoverable={false} data-testid="card">x</Card>);
    const el = screen.getByTestId('card');
    expect(el.className).not.toContain('hover:shadow-card-hover');
    expect(el.className).not.toContain('hover:-translate-y-px');
  });

  it('merges custom className', () => {
    render(<Card className="p-4 custom" data-testid="card">x</Card>);
    const el = screen.getByTestId('card');
    expect(el.className).toContain('p-4');
    expect(el.className).toContain('custom');
  });
});
