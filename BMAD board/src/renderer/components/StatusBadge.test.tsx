import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import { StatusBadge, PriorityBadge } from './StatusBadge';

const statusCases = [
  { status: 'backlog', label: 'Backlog', bg: 'bg-status-backlog-bg', fg: 'text-status-backlog-fg' },
  { status: 'todo', label: 'To Do', bg: 'bg-status-todo-bg', fg: 'text-status-todo-fg' },
  { status: 'in-progress', label: 'In Progress', bg: 'bg-status-in-progress-bg', fg: 'text-status-in-progress-fg' },
  { status: 'in-review', label: 'In Review', bg: 'bg-status-in-review-bg', fg: 'text-status-in-review-fg' },
  { status: 'done', label: 'Done', bg: 'bg-status-done-bg', fg: 'text-status-done-fg' },
  { status: 'draft', label: 'Draft', bg: 'bg-status-draft-bg', fg: 'text-status-draft-fg' },
  { status: 'ready', label: 'Ready', bg: 'bg-status-ready-bg', fg: 'text-status-ready-fg' },
] as const;

const priorityCases = [
  { priority: 'critical', color: 'text-priority-critical' },
  { priority: 'high', color: 'text-priority-high' },
  { priority: 'medium', color: 'text-priority-medium' },
  { priority: 'low', color: 'text-priority-low' },
] as const;

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('StatusBadge', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders rounded-full pill shape', () => {
    renderWithI18n(<StatusBadge status="backlog" />);
    const el = screen.getByText('Backlog');
    expect(el.className).toContain('rounded-full');
  });

  it('renders text-caption class', () => {
    renderWithI18n(<StatusBadge status="backlog" />);
    const el = screen.getByText('Backlog');
    expect(el.className).toContain('text-caption');
  });

  it('renders inline-flex items-center layout', () => {
    renderWithI18n(<StatusBadge status="backlog" />);
    const el = screen.getByText('Backlog');
    expect(el.className).toContain('inline-flex');
    expect(el.className).toContain('items-center');
  });

  it.each(statusCases)('renders $status with correct bg/fg tokens', ({ status, label, bg, fg }) => {
    renderWithI18n(<StatusBadge status={status as any} />);
    const el = screen.getByText(label);
    expect(el.className).toContain(bg);
    expect(el.className).toContain(fg);
  });

  it('renders i18n-translated label for backlog', () => {
    renderWithI18n(<StatusBadge status="backlog" />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders rounded-md shape', () => {
    renderWithI18n(<PriorityBadge priority="critical" />);
    const el = screen.getByText('Critical').closest('span')!;
    expect(el.className).toContain('rounded-md');
  });

  it('renders filled dot with w-2 h-2', () => {
    const { container } = renderWithI18n(<PriorityBadge priority="high" />);
    const dot = container.querySelector('.w-2.h-2.rounded-full.bg-current');
    expect(dot).toBeInTheDocument();
  });

  it('renders text-caption class', () => {
    renderWithI18n(<PriorityBadge priority="medium" />);
    const el = screen.getByText('Medium').closest('span')!;
    expect(el.className).toContain('text-caption');
  });

  it('renders gap-1.5', () => {
    renderWithI18n(<PriorityBadge priority="low" />);
    const el = screen.getByText('Low').closest('span')!;
    expect(el.className).toContain('gap-1.5');
  });

  it.each(priorityCases)('renders $priority with correct color token', ({ priority, color }) => {
    renderWithI18n(<PriorityBadge priority={priority as any} />);
    const label = priority === 'critical' ? 'Critical' : priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low';
    const el = screen.getByText(label).closest('span')!;
    expect(el.className).toContain(color);
  });
});
