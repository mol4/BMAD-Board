import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import type { AppConfig } from '../../shared/ipc-channels';

const navItems = [
  {
    key: 'nav.dashboard' as const,
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: 'nav.board' as const,
    href: '/board',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
      </svg>
    ),
  },
  {
    key: 'nav.backlog' as const,
    href: '/backlog',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    key: 'nav.epics' as const,
    href: '/epics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: 'nav.docs' as const,
    href: '/docs',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'nav.diagnostics' as const,
    href: '/diagnostics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { t, locale, setLocale } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    epicsDir: '',
    storiesDir: '',
    storiesMode: 'nested',
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
        console.log(t('sidebar.save'));
      }
    } catch {
      console.error(t('sidebar.configSaveError'));
    }
  };

  return (
    <aside
      className={`bg-surface-elevated text-foreground-primary flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
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
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && <span>{t('sidebar.pathSettings')}</span>}
        </button>

        {showSettings && !collapsed && configLoaded && (
          <div className="p-3 bg-surface-sunken rounded-lg space-y-3">
            <div>
              <label className="block text-xs text-foreground-tertiary mb-1">{t('sidebar.epicsPath')}</label>
              <input
                type="text"
                value={config.epicsDir}
                onChange={(e) => setConfig({ ...config, epicsDir: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border-default rounded text-xs text-foreground-primary placeholder-foreground-tertiary focus:border-accent focus:outline-none"
                placeholder="_bmad-output/planning-artifacts/epics"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-tertiary mb-1">{t('sidebar.storiesPath')}</label>
              <input
                type="text"
                value={config.storiesDir}
                onChange={(e) => setConfig({ ...config, storiesDir: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border-default rounded text-xs text-foreground-primary placeholder-foreground-tertiary focus:border-accent focus:outline-none"
                placeholder="_bmad-output/planning-artifacts/stories"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-tertiary mb-1">{t('sidebar.storiesMode')}</label>
              <select
                value={config.storiesMode}
                onChange={(e) => setConfig({ ...config, storiesMode: e.target.value as 'nested' | 'flat' })}
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border-default rounded text-xs text-foreground-primary focus:border-accent focus:outline-none"
              >
                <option value="nested">{t('sidebar.nestedMode')}</option>
                <option value="flat">{t('sidebar.flatMode')}</option>
              </select>
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
                    console.log('Config reset');
                  } catch {
                    console.log('Config reset error');
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
          onClick={async () => {
            try {
              console.log('Sync triggered');
              window.location.reload();
            } catch {
              console.log(t('sidebar.syncError'));
            }
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors ${collapsed ? 'justify-center' : ''
            }`}
          title={t('sidebar.syncWithMd')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
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
      </div>
    </aside>
  );
}
