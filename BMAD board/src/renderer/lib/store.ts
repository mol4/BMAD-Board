import { create } from 'zustand';
import type { Epic, Story } from '@/lib/types';

interface AppState {
  activeProjectId: string | null;
  epics: Epic[];
  stories: Story[];
  loading: boolean;
  error: string | null;
  setActiveProject: (id: string | null) => void;
  setEpics: (epics: Epic[]) => void;
  setStories: (stories: Story[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectId: null,
  epics: [],
  stories: [],
  loading: false,
  error: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
  setEpics: (epics) => set({ epics }),
  setStories: (stories) => set({ stories }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
