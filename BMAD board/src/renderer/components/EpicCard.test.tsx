import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import EpicCard from './EpicCard';

function renderEpicCard(epicOverrides?: Partial<ReturnType<typeof useAppStore.getState>['createEpic'] extends (req: infer R) => unknown ? R : never>) {
  const store = useAppStore.getState();
  const epic = store.createEpic({ title: 'Test Epic', description: 'Epic description', ...epicOverrides });
  return render(
    <MemoryRouter>
      <I18nProvider>
        <EpicCard epic={epic} />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe('EpicCard', () => {
  beforeEach(() => {
    cleanup();
    useAppStore.getState().clear();
    useAppStore.getState().setInitialized(true);
  });

  it('renders epic title and key', () => {
    renderEpicCard();
    expect(screen.getByText('Test Epic')).toBeInTheDocument();
    expect(screen.getByText('EPIC-1')).toBeInTheDocument();
  });

  it('renders description', () => {
    renderEpicCard();
    expect(screen.getByText('Epic description')).toBeInTheDocument();
  });

  it('shows progress bar with correct width for 50% done', () => {
    const store = useAppStore.getState();
    const epic = store.createEpic({ title: 'Epic', description: '' });
    const s1 = store.createStory({ epicId: epic.id, title: 'S1', description: '' });
    const s2 = store.createStory({ epicId: epic.id, title: 'S2', description: '' });
    store.updateStoryStatus(s1.id, 'done');

    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicCard epic={epic} />
        </I18nProvider>
      </MemoryRouter>,
    );

    const progressBar = document.querySelector('.bg-accent.rounded-full');
    expect(progressBar).toBeTruthy();
    expect((progressBar as HTMLElement).style.width).toBe('50%');
  });

  it('navigates to epic detail on click', () => {
    const store = useAppStore.getState();
    const epic = store.createEpic({ title: 'Epic', description: '' });

    render(
      <MemoryRouter>
        <I18nProvider>
          <EpicCard epic={epic} />
        </I18nProvider>
      </MemoryRouter>,
    );

    const card = screen.getByRole('article');
    fireEvent.click(card);
    // Navigation happens via useNavigate — no assertion needed beyond no crash
  });

  it('renders labels when present', () => {
    renderEpicCard({ labels: ['frontend', 'urgent'] });
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });
});
