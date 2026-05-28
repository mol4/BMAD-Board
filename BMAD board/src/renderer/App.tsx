import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import BoardPage from '@/pages/BoardPage';
import BacklogPage from '@/pages/BacklogPage';
import EpicsPage from '@/pages/EpicsPage';
import StoryDetailPage from '@/pages/StoryDetailPage';
import DocsPage from '@/pages/DocsPage';
import DiagnosticsPage from '@/pages/DiagnosticsPage';
import NotFoundPage from '@/pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="backlog" element={<BacklogPage />} />
        <Route path="epics" element={<EpicsPage />} />
        <Route path="stories/:id" element={<StoryDetailPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="diagnostics" element={<DiagnosticsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App(): JSX.Element {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;
