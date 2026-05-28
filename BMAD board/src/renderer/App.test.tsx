import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';

describe('App', () => {
  it('renders Dashboard page at root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders Board page at /board route', () => {
    render(
      <MemoryRouter initialEntries={['/board']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Board')).toBeInTheDocument();
  });

  it('renders Backlog page at /backlog route', () => {
    render(
      <MemoryRouter initialEntries={['/backlog']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  it('renders Epics page at /epics route', () => {
    render(
      <MemoryRouter initialEntries={['/epics']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Epics')).toBeInTheDocument();
  });

  it('renders Story detail page at /stories/:id', () => {
    render(
      <MemoryRouter initialEntries={['/stories/STORY-1']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Story Detail')).toBeInTheDocument();
  });

  it('renders Docs page at /docs route', () => {
    render(
      <MemoryRouter initialEntries={['/docs']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('renders Diagnostics page at /diagnostics route', () => {
    render(
      <MemoryRouter initialEntries={['/diagnostics']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
  });

  it('renders 404 page for unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
