import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { storeManager } from '@/lib/store-manager';
import { getConfig, setConfig as setGlobalConfig, subscribeConfig, type BmadConfig } from '@/lib/config';
import { LayoutDashboard, Columns2, AlignJustify, Zap, FileText, BarChart3, Settings, RefreshCw, Folder, CircleHelp, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ThemeToggle from '@/components/ThemeToggle';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { syncEngine } from '@/lib/sync-engine';

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
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('bmad-sidebar-collapsed');
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [config, setConfig] = useState<BmadConfig>(getConfig());
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const configLoadedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    try {
      localStorage.setItem('bmad-sidebar-collapsed', JSON.stringify(collapsed));
    } catch {
      // localStorage unavailable (private browsing, quota exceeded)
    }
  }, [collapsed]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setConfig(getConfig());
    return subscribeConfig((newConfig) => {
      setConfig(newConfig);
      setConfigLoaded(true);
      configLoadedRef.current = true;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadActiveProjectConfig() {
      if (!window.electronAPI || !activeProjectId) {
        setProjectName('');
        return;
      }
      try {
        const projects = await window.electronAPI.projectList();
        if (cancelled) return;
        const project = projects.find((p) => p.id === activeProjectId);
        if (project) {
          setProjectName(project.name);
          setConfig((prev) => ({
            ...prev,
            epicsDir: project.epicsDir,
            storiesDir: project.storiesDir,
          }));
          setConfigLoaded(true);
          configLoadedRef.current = true;
        }
      } catch (err) {
        console.error('[Sidebar] Failed to load active project config:', err);
      }
    }
    loadActiveProjectConfig();
    return () => { cancelled = true; };
  }, [activeProjectId]);

  const saveConfig = async () => {
    if (isSaving) return;
    try {
      if (!window.electronAPI) return;
      setIsSaving(true);
      if (activeProjectId) {
        const trimmedName = projectName.trim();
        if (!trimmedName) {
          showToast(t('toast.projectNameRequired'), 'error');
          return;
        }
        if (!config.epicsDir.trim()) {
          showToast(t('toast.epicsPathRequired'), 'error');
          return;
        }
        if (!config.storiesDir.trim()) {
          showToast(t('toast.storiesPathRequired'), 'error');
          return;
        }
        const epicsExists = await window.electronAPI.fileReadDirectory(config.epicsDir).then(() => true).catch(() => false);
        if (!epicsExists) {
          showToast(t('toast.epicsPathNotFound'), 'error');
          return;
        }
        const storiesExists = await window.electronAPI.fileReadDirectory(config.storiesDir).then(() => true).catch(() => false);
        if (!storiesExists) {
          showToast(t('toast.storiesPathNotFound'), 'error');
          return;
        }
        const updated = await window.electronAPI.projectUpdate({
          projectId: activeProjectId,
          name: trimmedName,
          epicsDir: config.epicsDir,
          storiesDir: config.storiesDir,
        });
        if (!updated) {
          showToast(t('toast.projectUpdateError'), 'error');
          return;
        }
        setGlobalConfig({
          epicsDir: config.epicsDir,
          storiesDir: config.storiesDir,
        });
        window.dispatchEvent(new CustomEvent('bmad:project-updated'));
        await storeManager.switchProject(activeProjectId);
        showToast(t('toast.configSaved'), 'success');
      } else {
        await window.electronAPI.configWrite(config);
        setGlobalConfig(config);
        showToast(t('toast.configSaved'), 'success');
      }
    } catch {
      showToast(t('toast.configSaveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetConfig = async () => {
    try {
      if (!window.electronAPI) return;
      if (activeProjectId) {
        const projects = await window.electronAPI.projectList();
        const project = projects.find((p) => p.id === activeProjectId);
        if (project) {
          setProjectName(project.name);
          setConfig((prev) => ({
            ...prev,
            epicsDir: project.epicsDir,
            storiesDir: project.storiesDir,
          }));
          showToast(t('toast.configReset'), 'success');
        }
      } else {
        const data = await window.electronAPI.configRead();
        setConfig(data);
        setProjectName('');
        showToast(t('toast.configReset'), 'success');
      }
    } catch {
      showToast(t('toast.configResetError'), 'error');
    }
  };

  return (
    <aside
      className={`bg-surface-elevated text-foreground-primary flex flex-col transition-all duration-200 ease-out ${collapsed ? 'w-16' : 'w-[260px]'
        }`}
    >
      <div className="border-b border-border-default">
        <div className={`flex ${collapsed ? 'flex-col items-center gap-1 py-3 px-1' : 'items-center gap-2 p-4 pb-2'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-bold text-sm text-foreground-on-accent shrink-0">
                BB
              </div>
              <h1 className="font-bold text-sm truncate">BMAD Board</h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-bold text-sm text-foreground-on-accent shrink-0">
              BB
            </div>
          )}
        </div>
        <div className={`pb-3 ${collapsed ? 'px-1' : 'px-4'}`}>
          <ProjectSwitcher collapsed={collapsed} />
        </div>
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
          <li>
            <NavLink
              to="/welcome"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive
                  ? 'bg-accent text-foreground-on-accent'
                  : 'text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary'
                }`
              }
              title={collapsed ? t('nav.help') : undefined}
            >
              <CircleHelp size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{t('nav.help')}</span>}
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-border-default space-y-2">
        <button
          onClick={() => !collapsed && setShowSettings(!showSettings)}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors ${collapsed ? 'justify-center' : ''
            }`}
          title={t('sidebar.projectSettings')}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span>{t('sidebar.projectSettings')}</span>}
        </button>

        {showSettings && !collapsed && configLoaded && (
          <div className="p-3 bg-surface-sunken rounded-lg space-y-3">
            <div>
              <label className="block text-xs text-foreground-tertiary mb-1">{t('sidebar.projectName')}</label>
              <Input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-xs"
                placeholder={t('sidebar.projectNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-tertiary mb-1">{t('sidebar.epicsPath')}</label>
              <div className="flex gap-1">
                <Input
                  type="text"
                  value={config.epicsDir}
                  onChange={(e) => setConfig({ ...config, epicsDir: e.target.value })}
                  className="flex-1 min-w-0 text-xs"
                  placeholder="_bmad-output/planning-artifacts/epics"
                />
                <button
                  onClick={async () => {
                    if (!window.electronAPI) return;
                    const result = await window.electronAPI.dialogOpenDirectory();
                    if (!result.canceled && result.filePaths[0]) {
                      setConfig((prev) => ({ ...prev, epicsDir: result.filePaths[0] }));
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
                <Input
                  type="text"
                  value={config.storiesDir}
                  onChange={(e) => setConfig({ ...config, storiesDir: e.target.value })}
                  className="flex-1 min-w-0 text-xs"
                  placeholder="_bmad-output/planning-artifacts/stories"
                />
                <button
                  onClick={async () => {
                    if (!window.electronAPI) return;
                    const result = await window.electronAPI.dialogOpenDirectory();
                    if (!result.canceled && result.filePaths[0]) {
                      setConfig((prev) => ({ ...prev, storiesDir: result.filePaths[0] }));
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
              <Button
                variant="primary"
                onClick={saveConfig}
                disabled={isSaving}
                className="flex-1 text-xs"
              >
                {isSaving ? t('common.loading') : t('sidebar.save')}
              </Button>
              <Button
                variant="secondary"
                onClick={resetConfig}
                className="text-xs"
              >
                {t('sidebar.reset')}
              </Button>
            </div>
          </div>
        )}

        {activeProjectId && (
          <button
            onClick={async () => {
              if (isSyncing || syncEngine.syncing) return;
              setIsSyncing(true);
              try {
                await syncEngine.forceFullSync();
                if (!mountedRef.current) return;
                showToast(t('toast.syncComplete'), 'success');
              } catch {
                if (!mountedRef.current) return;
                showToast(t('toast.syncFailed'), 'error');
              } finally {
                if (mountedRef.current) {
                  setIsSyncing(false);
                }
              }
            }}
            disabled={isSyncing || syncEngine.syncing}
            aria-busy={isSyncing || syncEngine.syncing}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors disabled:opacity-50 ${collapsed ? 'justify-center' : ''
              }`}
            title={t('sidebar.syncTooltip')}
          >
            <RefreshCw size={18} className={`shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            {!collapsed && <span>{t('sidebar.sync')}</span>}
          </button>
        )}

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

        <ThemeToggle collapsed={collapsed} />
      </div>

      <div className="px-2 py-3 border-t border-border-default">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-foreground-secondary hover:bg-accent-subtle hover:text-foreground-primary transition-colors ${collapsed ? 'justify-center' : ''}`}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronsRight size={18} className="shrink-0" /> : <ChevronsLeft size={18} className="shrink-0" />}
          {!collapsed && <span>{t('sidebar.collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}
