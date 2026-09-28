// removed React import
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Map as MapIcon, LogOut, ShieldAlert, LineChart, CheckSquare, Inbox, ShieldCheck } from 'lucide-react';
import classNames from 'classnames';

export default function Sidebar({ user, onLogout }: { user: any, onLogout: () => void }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Asset Registry', path: '/assets', icon: List },
    { name: 'Work Orders', path: '/kanban', icon: CheckSquare },
    ...(user.role === 'Manager' || user.role === 'Auditor' ? [{ name: 'Approvals', path: '/approvals', icon: Inbox }] : []),
    ...(user.role === 'Manager' || user.role === 'Auditor' ? [{ name: 'Audit Logs', path: '/audit', icon: ShieldCheck }] : []),
    { name: 'Capital Plan', path: '/planning', icon: LineChart },
    { name: 'Map View', path: '/map', icon: MapIcon },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-white flex-col h-full shadow-xl z-20">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
            <ShieldAlert className="w-6 h-6" />
            InfraAsset
          </h1>
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-slate-400">Role: <span className="text-indigo-400">{user.role}</span></p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => classNames(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 z-50 pb-safe">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => classNames(
              "flex flex-col items-center p-2 rounded-lg text-xs font-medium min-w-[4rem]",
              isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <item.icon className="w-6 h-6 mb-1" />
            {item.name.split(' ')[0]}
          </NavLink>
        ))}
      </div>
    </>
  );
}
