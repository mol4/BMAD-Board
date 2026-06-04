import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import type { AppConfig } from '../../shared/ipc-channels';
import { LayoutDashboard, Columns2, AlignJustify, Zap, FileText, BarChart3, ChevronLeft, Settings, RefreshCw, Folder, Sun, Moon } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/components/ThemeProvider';

const navItems = [
  {
    key: 'nav.dashboard' as const,
    href: '/',
    icon: <LayoutDashboard size={18} className="shrink-0" />,
  },
  {
    key: 'nav.board' as const,
    href: '/board',
    icon: <Columns2 size={18} className="shrink-0" />,
  },
  {
    key: 'nav.backlog' as const,
    href: '/backlog',
    icon: <AlignJustify size={18} className="shrink-0" />,
  },
  {
    key: 'nav.epics' as const,
    href: '/epics',
    icon: <Zap size={18} className="shrink-0" />,
  },
  {
    key: 'nav.docs' as const,
    href: '/docs',
    icon: <FileText size={18} className="shrink-0" />,
  },
  {
    key: 'nav.diagnostics' as const,
    href: '/diagnostics',
    icon: <BarChart3 size={18} className="shrink-0" />,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { t, locale, setLocale } = useI18n();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    epicsDir: '',
    storiesDir: '',
    storiesMode: 'flat',
    lastProjectId: null,
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  const configLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (window.electronAPI) {
      window.electronAPI.configRead().then((data) => {
        if (!cancelled) {
          setConfig(data);
          setConfigLoaded(true);
          configLoadedRef.current = true;
        }
      }).catch(() => {
        if (!cancelled) {
          setConfigLoaded(true);
          configLoadedRef.current = true;
        }
      });
    } else {
      setConfigLoaded(true);
      configLoadedRef.current = true;
    }
    return () => { cancelled = true; };
  }, []);

  const saveConfig = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.configWrite(config);
        showToast(t('toast.configSaved'), 'success');
      }
    } catch {
      showToast(t('toast.configSaveError'), 'error');
    }
  };

  return (
    <aside
      className={`bg-surface-elevated text-foreground-primary flex flex-col transition-all duration-200 ease-win11 ${collapsed ? 'w-16' : 'w-64'
        }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-bold text-sm text-foreground-on-accent">
              BB
            </div>
            <div>
              <h1 className="font-bold text-sm">BMAD Board</h1>
              <p className="text-xs text-foreground-tertiary">{t('sidebar.localProject')}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-accent-subtle transition-colors"
        >
          <ChevronLeft
            size={16}
            className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive
                    ? 'bg-accent text-foreground-on-accent'
                    : 'text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary'
                    }`}
                  title={collapsed ? t(item.key) : undefined}
                >
                  {item.icon}
                  {!collapsed && <span className="text-sm font-medium">{t(item.key)}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border-default space-y-2">
        <button
          onClick={() => !collapsed && setShowSettings(!showSettings)}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors ${collapsed ? 'justify-center' : ''
            }`}
          title={t('sidebar.pathSettings')}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span>{t('sidebar.pathSettings')}</span>}
        </button>

        {showSettings && !collapsed && configLoaded && (
          <div className="p-3 bg-surface-sunken rounded-lg space-y-3">
            <div>
              <label className="block text-xs text-foreground-tertiary mb-1">{t('sidebar.epicsPath')}</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={config.epicsDir}
                  onChange={(e) => setConfig({ ...config, epicsDir: e.target.value })}
                  className="flex-1 min-w-0 px-2 py-1.5 bg-surface-elevated border border-border-default rounded text-xs text-foreground-primary placeholder-foreground-tertiary focus:border-accent focus:outline-none"
                  placeholder="_bmad-output/planning-artifacts/epics"
                />
                <button
                  onClick={async () => {
                    if (!window.electronAPI) return;
                    const result = await window.electronAPI.dialogOpenDirectory();
                    if (!result.canceled && result.filePaths[0]) {
                      setConfig({ ...config, epicsDir: result.filePaths[0] });
                    }
                  }}
                  className="px-2 py-1.5 bg-surface-elevated border border-border-default rounded hover:bg-accent-subtle transition-colors shrink-0"
                  title={t('sidebar.browseFolder')}
                >
                  <Folder size={14} className="text-foreground-tertiary" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-foreground-tertiary mb-1">{t('sidebar.storiesPath')}</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={config.storiesDir}
                  onChange={(e) => setConfig({ ...config, storiesDir: e.target.value })}
                  className="flex-1 min-w-0 px-2 py-1.5 bg-surface-elevated border border-border-default rounded text-xs text-foreground-primary placeholder-foreground-tertiary focus:border-accent focus:outline-none"
                  placeholder="_bmad-output/planning-artifacts/stories"
                />
                <button
                  onClick={async () => {
                    if (!window.electronAPI) return;
                    const result = await window.electronAPI.dialogOpenDirectory();
                    if (!result.canceled && result.filePaths[0]) {
                      setConfig({ ...config, storiesDir: result.filePaths[0] });
                    }
                  }}
                  className="px-2 py-1.5 bg-surface-elevated border border-border-default rounded hover:bg-accent-subtle transition-colors shrink-0"
                  title={t('sidebar.browseFolder')}
                >
                  <Folder size={14} className="text-foreground-tertiary" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveConfig}
                className="flex-1 px-2 py-1.5 bg-accent text-foreground-on-accent text-xs rounded hover:bg-accent-hover transition-colors"
              >
                {t('sidebar.save')}
              </button>
              <button
                onClick={async () => {
                  try {
                    const defaultConfig: AppConfig = {
                      epicsDir: '../_bmad-output/planning-artifacts',
                      storiesDir: '../_bmad-output/implementation-artifacts',
                      storiesMode: 'flat',
                      lastProjectId: null,
                    };
                    if (window.electronAPI) {
                      await window.electronAPI.configWrite(defaultConfig);
                    }
                    setConfig(defaultConfig);
                    showToast(t('toast.configReset'), 'success');
                  } catch {
                    showToast(t('toast.configResetError'), 'error');
                  }
                }}
                className="px-2 py-1.5 bg-surface-sunken text-foreground-secondary text-xs rounded hover:bg-border-default transition-colors"
              >
                {t('sidebar.reset')}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            window.location.reload();
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors ${collapsed ? 'justify-center' : ''
            }`}
          title={t('sidebar.syncWithMd')}
        >
          <RefreshCw size={18} className="shrink-0" />
          {!collapsed && <span>{t('sidebar.syncMd')}</span>}
        </button>

        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-1'}`}>
          <button
            onClick={() => setLocale('ru')}
            className={`px-2 py-1 text-xs rounded transition-colors ${locale === 'ru'
              ? 'bg-accent text-foreground-on-accent'
              : 'text-foreground-tertiary hover:text-foreground-primary hover:bg-accent-subtle'
              }`}
          >
            RU
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-2 py-1 text-xs rounded transition-colors ${locale === 'en'
              ? 'bg-accent text-foreground-on-accent'
              : 'text-foreground-tertiary hover:text-foreground-primary hover:bg-accent-subtle'
              }`}
          >
            EN
          </button>
        </div>

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
      </div>
    </aside>
  );
}
