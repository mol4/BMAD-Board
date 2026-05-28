import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-jira-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
