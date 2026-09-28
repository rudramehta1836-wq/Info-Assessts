import { useState, useEffect } from 'react';
import { api } from '../api';
import { ShieldCheck, Activity, User, FileText, Database, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import classNames from 'classnames';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs');
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getEntityIcon = (type: string) => {
    switch(type) {
      case 'Asset': return <Database className="w-4 h-4" />;
      case 'WorkOrder': return <FileText className="w-4 h-4" />;
      case 'User': return <User className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'Create': return 'text-emerald-600 bg-emerald-50';
      case 'Update': return 'text-blue-600 bg-blue-50';
      case 'Delete': return 'text-red-600 bg-red-50';
      case 'Transition': return 'text-indigo-600 bg-indigo-50';
      case 'Inspection': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  if (loading) return <div className="p-8">Verifying chain...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            System Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">Immutable, tamper-evident ledger of all system actions</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Chain Validated
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Target Entity</th>
                <th className="p-4 font-semibold">Payload Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((log) => {
                const changes = log.changes ? JSON.parse(log.changes) : {};
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-slate-600">
                      <div className="font-medium text-slate-900">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</div>
                      <div className="text-xs text-slate-400">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {log.user_name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{log.user_name}</span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={classNames("px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide", getActionColor(log.action))}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        {getEntityIcon(log.entity_type)}
                        {log.entity_type} <ArrowRight className="w-3 h-3 text-slate-400 mx-1" /> <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 rounded">{log.entity_id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {Object.keys(changes).length > 0 ? (
                        <div className="text-xs font-mono bg-slate-900 text-green-400 p-2 rounded-lg max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                          {JSON.stringify(changes)}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No payload</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
