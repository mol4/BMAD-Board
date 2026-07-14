import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Textarea from './Textarea';

describe('Textarea', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders with correct base classes', () => {
    render(<Textarea data-testid="textarea" />);
    const el = screen.getByTestId('textarea');
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('px-3');
    expect(el.className).toContain('py-2');
    expect(el.className).toContain('bg-surface-elevated');
    expect(el.className).toContain('border-border-default');
    expect(el.className).toContain('rounded-md');
    expect(el.className).toContain('text-foreground-primary');
    expect(el.className).toContain('resize-y');
    expect(el.className).toContain('min-h-[80px]');
  });

  it('defaults to 4 rows', () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '4');
  });

  it('accepts custom rows', () => {
    render(<Textarea rows={8} data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '8');
  });

  it('applies disabled styles', () => {
    render(<Textarea disabled data-testid="textarea" />);
    const el = screen.getByTestId('textarea') as HTMLTextAreaElement;
    expect(el.disabled).toBe(true);
    expect(el.className).toContain('disabled:opacity-50');
    expect(el.className).toContain('disabled:pointer-events-none');
  });

  it('calls onChange', () => {
    const fn = vi.fn();
    render(<Textarea onChange={fn} data-testid="textarea" />);
    fireEvent.change(screen.getByTestId('textarea'), { target: { value: 'a' } });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    expect(screen.getByTestId('textarea').className).toContain('custom-class');
  });

  it('sets placeholder', () => {
    render(<Textarea placeholder="Enter text" data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('placeholder', 'Enter text');
  });
});
