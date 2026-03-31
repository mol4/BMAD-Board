'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

interface BmadConfig {
  epicsDir: string;
  storiesDir: string;
  storiesMode: 'nested' | 'flat';
}

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
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<BmadConfig>({
    epicsDir: '',
    storiesDir: '',
    storiesMode: 'nested',
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setConfigLoaded(true);
      });
  }, []);

  const saveConfig = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      alert(data.message || t('sidebar.save'));
    } catch {
      alert(t('sidebar.configSaveError'));
    }
  };

  return (
    <aside
      className={`bg-jira-gray-900 text-white flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-jira-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-jira-blue rounded flex items-center justify-center font-bold text-sm">
              BB
            </div>
            <div>
              <h1 className="font-bold text-sm">BMAD Board</h1>
              <p className="text-xs text-jira-gray-400">{t('sidebar.localProject')}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-jira-gray-700 transition-colors"
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
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-jira-blue text-white'
                      : 'text-jira-gray-300 hover:bg-jira-gray-700 hover:text-white'
                  }`}
                  title={collapsed ? t(item.key) : undefined}
                >
                  {item.icon}
                  {!collapsed && <span className="text-sm font-medium">{t(item.key)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-jira-gray-700 space-y-2">
        <button
          onClick={() => !collapsed && setShowSettings(!showSettings)}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-jira-gray-300 hover:bg-jira-gray-700 hover:text-white transition-colors ${
            collapsed ? 'justify-center' : ''
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
          <div className="p-3 bg-jira-gray-800 rounded-lg space-y-3">
            <div>
              <label className="block text-xs text-jira-gray-400 mb-1">{t('sidebar.epicsPath')}</label>
              <input
                type="text"
                value={config.epicsDir}
                onChange={(e) => setConfig({ ...config, epicsDir: e.target.value })}
                className="w-full px-2 py-1.5 bg-jira-gray-700 border border-jira-gray-600 rounded text-xs text-white placeholder-jira-gray-500 focus:border-jira-blue focus:outline-none"
                placeholder="_bmad-output/planning-artifacts/epics"
              />
            </div>
            <div>
              <label className="block text-xs text-jira-gray-400 mb-1">{t('sidebar.storiesPath')}</label>
              <input
                type="text"
                value={config.storiesDir}
                onChange={(e) => setConfig({ ...config, storiesDir: e.target.value })}
                className="w-full px-2 py-1.5 bg-jira-gray-700 border border-jira-gray-600 rounded text-xs text-white placeholder-jira-gray-500 focus:border-jira-blue focus:outline-none"
                placeholder="_bmad-output/planning-artifacts/stories"
              />
            </div>
            <div>
              <label className="block text-xs text-jira-gray-400 mb-1">{t('sidebar.storiesMode')}</label>
              <select
                value={config.storiesMode}
                onChange={(e) => setConfig({ ...config, storiesMode: e.target.value as 'nested' | 'flat' })}
                className="w-full px-2 py-1.5 bg-jira-gray-700 border border-jira-gray-600 rounded text-xs text-white focus:border-jira-blue focus:outline-none"
              >
                <option value="nested">{t('sidebar.nestedMode')}</option>
                <option value="flat">{t('sidebar.flatMode')}</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveConfig}
                className="flex-1 px-2 py-1.5 bg-jira-blue text-white text-xs rounded hover:bg-jira-blue-dark transition-colors"
              >
                {t('sidebar.save')}
              </button>
              <button
                onClick={async () => {
                  const res = await fetch('/api/config', { method: 'DELETE' });
                  const data = await res.json();
                  setConfig(data.config);
                  alert(data.message);
                }}
                className="px-2 py-1.5 bg-jira-gray-600 text-white text-xs rounded hover:bg-jira-gray-500 transition-colors"
              >
                {t('sidebar.reset')}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/sync', { method: 'POST' });
              const data = await res.json();
              alert(`${t('sidebar.syncResult')}: ${data.message}`);
              window.location.reload();
            } catch {
              alert(t('sidebar.syncError'));
            }
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-jira-gray-300 hover:bg-jira-gray-700 hover:text-white transition-colors ${
            collapsed ? 'justify-center' : ''
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
            className={`px-2 py-1 text-xs rounded transition-colors ${
              locale === 'ru'
                ? 'bg-jira-blue text-white'
                : 'text-jira-gray-400 hover:text-white hover:bg-jira-gray-700'
            }`}
          >
            RU
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              locale === 'en'
                ? 'bg-jira-blue text-white'
                : 'text-jira-gray-400 hover:text-white hover:bg-jira-gray-700'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </aside>
  );
}