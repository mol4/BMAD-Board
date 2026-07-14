import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useFileWatcher } from '@/hooks/useFileWatcher';
import { useSyncAria, AriaLiveRegion } from '@/hooks/useSyncAria';

export default function Layout() {
  useFileWatcher();
  useSyncAria();
  const { pathname } = useLocation();
  const isBoard = pathname.startsWith('/board');
  return (
    <div className="flex h-screen bg-surface-base text-foreground-primary">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
          <div className={isBoard ? '' : 'max-w-7xl mx-auto w-full h-full'}>
          <Outlet />
        </div>
      </main>
      <AriaLiveRegion />
    </div>
  );
}
