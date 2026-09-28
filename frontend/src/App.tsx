import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AssetRegistry from './pages/AssetRegistry.tsx';
import MapPage from './pages/MapPage.tsx';
import AssetDetail from './pages/AssetDetail.tsx';
import CapitalPlanning from './pages/CapitalPlanning.tsx';
import WorkOrderKanban from './pages/WorkOrderKanban.tsx';
import ApprovalInbox from './pages/ApprovalInbox.tsx';
import CitizenPortal from './pages/CitizenPortal.tsx';
import AuditLogs from './pages/AuditLogs.tsx';
import Topbar from './components/Topbar.tsx';
import CommandPalette from './components/CommandPalette.tsx';

function App() {
  const [user, setUser] = useState<any>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) {
    if (window.location.pathname === '/report') {
       return <CitizenPortal />;
    }
    return <Login onLogin={setUser} />;
  }

  // Also allow authenticated users to see the report page if they really want to, but normally they use the dashboard
  if (window.location.pathname === '/report') {
     return <CitizenPortal />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
        <Sidebar user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar user={user} onOpenCommand={() => setCmdOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<AssetRegistry />} />
              <Route path="/assets/:id" element={<AssetDetail user={user} />} />
              <Route path="/planning" element={<CapitalPlanning />} />
              <Route path="/kanban" element={<WorkOrderKanban />} />
              <Route path="/approvals" element={<ApprovalInbox />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;
