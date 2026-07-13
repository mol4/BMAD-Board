import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import type { StoryStatus } from '@/lib/types';
import DashboardPage from './DashboardPage';

function seedStories(statuses: StoryStatus[]) {
  const store = useAppStore.getState();
  const epic = store.createEpic({ title: 'Epic', description: '' });
  for (const status of statuses) {
    const story = store.createStory({ epicId: epic.id, title: 'Story', description: '' });
    store.updateStoryStatus(story.id, status);
  }
}

describe('DashboardPage', () => {
  beforeEach(() => {
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
  });

  it('renders the 4-card stat grid when store has data', () => {
    useAppStore.getState().createEpic({ title: 'Epic', description: '' });
    render(
      <MemoryRouter>
        <I18nProvider>
          <DashboardPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('computes Active = (in-progress + in-review) and Completed = done', () => {
    seedStories(['in-progress', 'in-progress', 'in-review', 'done', 'done', 'backlog']);

    render(
      <MemoryRouter>
        <I18nProvider>
          <DashboardPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    const activeCard = screen.getByText('Active').closest('[role="button"]')!;
    const completedCard = screen.getByText('Completed').closest('[role="button"]')!;
    expect(within(activeCard).getByText('3')).toBeInTheDocument();
    expect(within(completedCard).getByText('2')).toBeInTheDocument();
  });

  it('renders StatCard with icon backgrounds', () => {
    useAppStore.getState().createEpic({ title: 'Epic', description: '' });
    render(
      <MemoryRouter>
        <I18nProvider>
          <DashboardPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    const iconBgs = document.querySelectorAll('.bg-accent');
    expect(iconBgs.length).toBeGreaterThanOrEqual(1);
  });

  it('preserves status distribution bar chart', () => {
    seedStories(['done', 'done', 'in-progress']);

    render(
      <MemoryRouter>
        <I18nProvider>
          <DashboardPage />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });
});
