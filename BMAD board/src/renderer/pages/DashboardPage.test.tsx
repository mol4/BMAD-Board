import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import type { StoryStatus } from '@/lib/types';
import DashboardPage from './DashboardPage';

/** Seed one epic and a story per requested status so getStats() returns non-zero buckets. */
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
    // Auto-cleanup is not registered (vitest globals are off), so unmount the
    // previous render explicitly to avoid leaked DOM matching the next query.
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
  });

  it('renders the 4-card stat grid with zeros on first run', () => {
    render(
      <I18nProvider>
        <DashboardPage />
      </I18nProvider>,
    );

    expect(screen.getByText('Epics')).toBeInTheDocument();
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4);
  });

  it('computes Active = (in-progress + in-review) and Completed = done', () => {
    // 2 in-progress + 1 in-review => Active 3; 2 done => Completed 2; +1 backlog => 6 stories.
    seedStories(['in-progress', 'in-progress', 'in-review', 'done', 'done', 'backlog']);

    render(
      <I18nProvider>
        <DashboardPage />
      </I18nProvider>,
    );

    // Scope each assertion to its card; the status-distribution block below also renders counts.
    const activeCard = screen.getByText('Active').parentElement!;
    const completedCard = screen.getByText('Completed').parentElement!;
    expect(within(activeCard).getByText('3')).toBeInTheDocument();
    expect(within(completedCard).getByText('2')).toBeInTheDocument();
  });
});
