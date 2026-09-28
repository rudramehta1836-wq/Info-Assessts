import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ShieldAlert, AlertTriangle, Activity, Wrench, Package, Radio } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = () => {
      api.get('/dashboard/stats').then(res => setStats(res.data));
      api.get('/audit-logs').then(res => setRecentLogs(res.data.slice(0, 5)));
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="p-8">Loading dashboard...</div>;

  const chartData = stats.statusCounts.map((s: any) => ({ name: s.status, value: s.count }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Infrastructure Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Assets</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalAssets}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg Condition (1-5)</p>
            <p className="text-2xl font-bold text-slate-900">{stats.conditionAvg.toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Open Work Orders</p>
            <p className="text-2xl font-bold text-slate-900">{stats.openWorkOrders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">Assets at Risk</p>
            <p className="text-2xl font-bold text-red-900">{stats.atRiskCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Assets by Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {chartData.map((d: any, i: number) => (
              <div key={d.name} className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-8 rounded-2xl shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <ShieldAlert className="w-48 h-48" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Proactive Management</h2>
          <p className="text-indigo-200 mb-6 max-w-md">The predictive engine has flagged {stats.atRiskCount} assets requiring immediate attention due to expiring useful life or critical condition scores.</p>
          <button onClick={() => navigate('/assets')} className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-lg font-medium w-max transition-colors">
            Review At-Risk Assets
          </button>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-500 animate-pulse" />
            Live Activity Feed
          </h2>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Connected
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {recentLogs.map((log: any) => (
            <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center font-bold text-slate-600">
                {log.user_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">
                  <span className="font-semibold">{log.user_name}</span> performed <span className="font-bold text-indigo-600">{log.action}</span> on {log.entity_type} <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">{log.entity_id}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
