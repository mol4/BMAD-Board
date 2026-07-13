import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatCard from './StatCard';
import { Box } from 'lucide-react';

describe('StatCard', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders label and value', () => {
    render(
      <MemoryRouter>
        <StatCard icon={<Box data-testid="icon" />} iconBg="bg-accent" label="Epics" value={5} navigateTo="/epics" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <MemoryRouter>
        <StatCard icon={<Box />} iconBg="bg-accent" label="Active" value={3} subtitle="In Progress + In Review" navigateTo="/board" />
      </MemoryRouter>,
    );
    expect(screen.getByText('In Progress + In Review')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(
      <MemoryRouter>
        <StatCard icon={<Box data-testid="icon" />} iconBg="bg-accent" label="Epics" value={1} navigateTo="/epics" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies icon background class', () => {
    render(
      <MemoryRouter>
        <StatCard icon={<Box />} iconBg="bg-status-done-bg" label="Done" value={2} navigateTo="/board" />
      </MemoryRouter>,
    );
    const iconContainer = document.querySelector('.rounded-full');
    expect(iconContainer?.className).toContain('bg-status-done-bg');
  });

  it('has cursor-pointer class', () => {
    render(
      <MemoryRouter>
        <StatCard icon={<Box />} iconBg="bg-accent" label="Epics" value={0} navigateTo="/epics" />
      </MemoryRouter>,
    );
    const card = screen.getByRole('button');
    expect(card.className).toContain('cursor-pointer');
  });
});
