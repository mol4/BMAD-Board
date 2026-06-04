import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';

function ThemeConsumer() {
  const { isDark, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{isDark ? 'dark' : 'light'}</button>;
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders with correct initial icon based on class', () => {
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button').textContent).toBe('dark');
  });

  it('toggleTheme switches class and localStorage', async () => {
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    const btn = screen.getByRole('button');
    expect(btn.textContent).toBe('dark');

    fireEvent.click(btn);

    expect(btn.textContent).toBe('light');
    expect(localStorage.getItem('bmad-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(btn);

    expect(btn.textContent).toBe('dark');
    expect(localStorage.getItem('bmad-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('useTheme throws outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within ThemeProvider');
    spy.mockRestore();
  });
});
