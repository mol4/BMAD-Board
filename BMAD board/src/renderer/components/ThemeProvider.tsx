import { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = useCallback(() => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    const newIsDark = !currentlyDark;
    document.documentElement.classList.toggle('dark', newIsDark);
    try {
      localStorage.setItem('bmad-theme', newIsDark ? 'dark' : 'light');
    } catch { /* ignore */ }
    setIsDark(newIsDark);
  }, []);

  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
