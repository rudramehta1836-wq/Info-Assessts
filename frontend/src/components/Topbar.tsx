import { Search, Bell, Settings } from 'lucide-react';

export default function Topbar({ user, onOpenCommand }: { user: any, onOpenCommand: () => void }) {
  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0 hidden md:flex">
      <div className="flex-1 flex items-center">
        <button 
          onClick={onOpenCommand}
          className="flex items-center gap-2 text-slate-400 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm transition-colors w-64 border border-slate-200"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-auto px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono">Ctrl+K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => alert('No new notifications at this time.')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <button 
          onClick={() => alert('Settings menu coming soon in the next release!')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="text-xs text-indigo-600 font-medium">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
