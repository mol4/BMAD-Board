import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useI18n } from '@/lib/i18n';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <button
      type="button"
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors ${collapsed ? 'justify-center' : ''}`}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
      {!collapsed && <span>{isDark ? t('theme.light') : t('theme.dark')}</span>}
    </button>
  );
}
