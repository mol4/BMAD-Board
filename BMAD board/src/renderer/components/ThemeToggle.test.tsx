import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { I18nProvider } from '@/lib/i18n';
import ThemeToggle from './ThemeToggle';

function renderThemeToggle(collapsed?: boolean) {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <ThemeToggle collapsed={collapsed} />
      </I18nProvider>
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders Sun icon when dark mode is active', () => {
    localStorage.setItem('bmad-theme', 'dark');
    renderThemeToggle();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders Moon icon when light mode is active', () => {
    localStorage.setItem('bmad-theme', 'light');
    renderThemeToggle();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('click toggles theme and updates localStorage', () => {
    localStorage.setItem('bmad-theme', 'dark');
    renderThemeToggle();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(btn);

    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('bmad-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(btn);

    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('bmad-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('shows label text in expanded mode', () => {
    localStorage.setItem('bmad-theme', 'dark');
    renderThemeToggle(false);
    expect(screen.getByText('Light theme')).toBeInTheDocument();
  });

  it('hides label text in collapsed mode', () => {
    localStorage.setItem('bmad-theme', 'dark');
    renderThemeToggle(true);
    expect(screen.queryByText('Light theme')).not.toBeInTheDocument();
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('justify-center');
  });

  it('title attribute shows correct tooltip', () => {
    localStorage.setItem('bmad-theme', 'dark');
    renderThemeToggle();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('title', 'Light theme');
  });

  it('defaults to dark when no stored theme and matchMedia returns true', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    renderThemeToggle();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
