import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Select from './Select';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('Select', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders options', () => {
    render(<Select options={options} data-testid="select" />);
    const el = screen.getByTestId('select') as HTMLSelectElement;
    expect(el.options.length).toBe(3);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders ChevronDown icon', () => {
    const { container } = render(<Select options={options} data-testid="select" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders placeholder option', () => {
    render(<Select options={options} placeholder="Choose..." data-testid="select" />);
    expect(screen.getByText('Choose...')).toBeInTheDocument();
  });

  it('applies correct base classes', () => {
    render(<Select options={options} data-testid="select" />);
    const el = screen.getByTestId('select');
    expect(el.className).toContain('w-full');
    expect(el.className).toContain('bg-surface-elevated');
    expect(el.className).toContain('border-border-default');
    expect(el.className).toContain('rounded-md');
    expect(el.className).toContain('appearance-none');
    expect(el.className).toContain('pr-9');
  });

  it('applies disabled styles', () => {
    render(<Select options={options} disabled data-testid="select" />);
    const el = screen.getByTestId('select') as HTMLSelectElement;
    expect(el.disabled).toBe(true);
    expect(el.className).toContain('disabled:opacity-50');
    expect(el.className).toContain('disabled:pointer-events-none');
  });

  it('calls onChange', () => {
    const fn = vi.fn();
    render(<Select options={options} onChange={fn} data-testid="select" />);
    fireEvent.change(screen.getByTestId('select'), { target: { value: 'b' } });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    render(<Select options={options} className="custom-class" data-testid="select" />);
    expect(screen.getByTestId('select').className).toContain('custom-class');
  });
});
