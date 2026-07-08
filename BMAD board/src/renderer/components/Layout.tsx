import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useFileWatcher } from '@/hooks/useFileWatcher';
import { useSyncAria, AriaLiveRegion } from '@/hooks/useSyncAria';

export default function Layout() {
  useFileWatcher();
  useSyncAria();
  return (
    <div className="flex h-screen bg-surface-base text-foreground-primary">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
      <AriaLiveRegion />
    </div>
  );
}
