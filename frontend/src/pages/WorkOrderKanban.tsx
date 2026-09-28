import { useState, useEffect } from 'react';
import { api } from '../api';
import { Clock, Search, GripVertical } from 'lucide-react';
import classNames from 'classnames';
import { format, formatDistanceToNow } from 'date-fns';

type WorkOrder = {
  id: number;
  asset_id: string;
  asset_status: string;
  status: string;
  priority: string;
  description: string;
  created_at: string;
  due_date: string | null;
};

export default function WorkOrderKanban() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get('/work-orders');
      setWorkOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeColumn !== status) {
      setActiveColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we are leaving the actual column container
    if (e.currentTarget === e.target) {
      setActiveColumn(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setActiveColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setActiveColumn(null);
    
    // Prefer React state, fallback to dataTransfer
    let id = draggedId;
    if (!id) {
      id = parseInt(e.dataTransfer.getData('text/plain'));
    }
    
    if (!id) return;
    
    // Optimistic update
    setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, status: newStatus } : wo));
    
    try {
      await api.put(`/work-orders/${id}/status`, { status: newStatus });
      fetchWorkOrders(); // refresh exact data
    } catch (err) {
      console.error(err);
      fetchWorkOrders(); // revert on fail
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, status: newStatus } : wo));
    try {
      await api.put(`/work-orders/${id}/status`, { status: newStatus });
      fetchWorkOrders();
    } catch (err) {
      fetchWorkOrders();
    }
  };

  const columns = ['Open', 'Assigned', 'In Progress', 'Done'];

  const filtered = workOrders.filter(wo => 
    wo.asset_id.toLowerCase().includes(search.toLowerCase()) || 
    wo.description.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  if (loading) return <div className="p-8">Loading Kanban...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Work Orders Board</h1>
          <p className="text-slate-500">Drag and drop to update status</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search work orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(status => {
          const columnWOs = filtered.filter(wo => wo.status === status);
          return (
            <div 
              key={status}
              className={classNames(
                "flex-shrink-0 w-80 rounded-2xl p-4 flex flex-col border transition-colors",
                activeColumn === status ? "bg-indigo-50 border-indigo-200 shadow-inner" : "bg-slate-100/50 border-slate-200/60"
              )}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                  {status} 
                  <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full font-medium">
                    {columnWOs.length}
                  </span>
                </h2>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto">
                {columnWOs.map(wo => (
                  <div 
                    key={wo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, wo.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative"
                  >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{wo.asset_id}</span>
                        <div className="flex items-center gap-1">
                          <span className={classNames("text-xs px-2 py-1 rounded-md font-bold border", getPriorityColor(wo.priority))}>
                            {wo.priority}
                          </span>
                          <select 
                            value={wo.status}
                            onChange={(e) => handleStatusChange(wo.id, e.target.value)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-1 cursor-pointer outline-none text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 font-medium line-clamp-2 mb-3">{wo.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDistanceToNow(new Date(wo.created_at), { addSuffix: true })}</span>
                        </div>
                        {wo.due_date && (
                          <div className={classNames("flex items-center gap-1 font-semibold", new Date(wo.due_date) < new Date() && wo.status !== 'Done' ? 'text-red-500' : 'text-slate-500')}>
                            <span>Due: {format(new Date(wo.due_date), 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {columnWOs.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium pointer-events-none">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
