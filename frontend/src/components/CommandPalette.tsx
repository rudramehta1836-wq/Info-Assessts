import { useEffect, useState } from 'react';
import { Search, MapPin, List, LayoutDashboard, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([
          { type: 'page', title: 'Dashboard', path: '/', icon: LayoutDashboard },
          { type: 'page', title: 'Asset Registry', path: '/assets', icon: List },
          { type: 'page', title: 'Map View', path: '/map', icon: MapPin }
        ]);
        return;
      }

      try {
        const { data: assets } = await api.get('/assets');
        const matches = assets.filter((a: any) => 
          a.id.toLowerCase().includes(query.toLowerCase()) || 
          a.ward.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5).map((a: any) => ({
          type: 'asset',
          title: `${a.id} (${a.category})`,
          subtitle: a.ward,
          path: `/assets/${a.id}`,
          icon: List
        }));
        
        setResults([
          ...matches,
          { type: 'page', title: 'Search on Map', path: `/map?q=${query}`, icon: MapPin }
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    
    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Search assets, wards, or jump to page..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
          />
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-mono">ESC</kbd>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { navigate(r.path); onClose(); }}
              className="w-full flex items-center px-4 py-3 hover:bg-slate-50 border-l-2 border-transparent hover:border-indigo-500 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 text-slate-600">
                <r.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{r.title}</p>
                {r.subtitle && <p className="text-xs text-slate-500">{r.subtitle}</p>}
              </div>
            </button>
          ))}
          {results.length === 0 && query.length >= 2 && (
            <div className="p-8 text-center text-slate-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
