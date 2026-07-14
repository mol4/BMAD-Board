import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders with correct base classes', () => {
    render(<Input data-testid="input" />);
    const el = screen.getByTestId('input');
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('px-3');
    expect(el.className).toContain('py-2');
    expect(el.className).toContain('bg-surface-elevated');
    expect(el.className).toContain('border-border-default');
    expect(el.className).toContain('rounded-md');
    expect(el.className).toContain('text-foreground-primary');
    expect(el.className).toContain('placeholder-foreground-tertiary');
  });

  it('spreads data-testid', () => {
    render(<Input data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toBeInTheDocument();
  });

  it('uses text type by default', () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
  });

  it('accepts custom type', () => {
    render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
  });

  it('applies disabled styles', () => {
    render(<Input disabled data-testid="input" />);
    const el = screen.getByTestId('input') as HTMLInputElement;
    expect(el.disabled).toBe(true);
    expect(el.className).toContain('disabled:opacity-50');
    expect(el.className).toContain('disabled:pointer-events-none');
  });

  it('calls onChange', () => {
    const fn = vi.fn();
    render(<Input onChange={fn} data-testid="input" />);
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'a' } });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);
    expect(screen.getByTestId('input').className).toContain('custom-class');
  });

  it('sets placeholder', () => {
    render(<Input placeholder="Enter text" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('placeholder', 'Enter text');
  });
});
