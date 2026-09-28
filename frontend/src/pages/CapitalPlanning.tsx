import { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calculator } from 'lucide-react';

export default function CapitalPlanning() {
  const [budgetCap, setBudgetCap] = useState(500000);
  const [plan, setPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/capital-plan?budgetCap=${budgetCap}`);
      setPlan(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [budgetCap]);

  const formatCurrency = (value: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">5-Year Capital Planning</h1>
        <p className="text-sm text-slate-500 mt-1">Simulate budget scenarios to forecast maintenance and replacement needs</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Annual Capital Budget Cap: <span className="text-indigo-600">{formatCurrency(budgetCap)}</span>
            </label>
            <input 
              type="range" 
              min="100000" 
              max="2000000" 
              step="50000" 
              value={budgetCap} 
              onChange={e => setBudgetCap(parseInt(e.target.value))} 
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>$100k</span>
              <span>$2M</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-4 max-w-sm">
            <Calculator className="w-8 h-8 text-indigo-500 shrink-0" />
            <p className="text-sm text-indigo-900">Adjust the slider to see how budget constraints increase your deferred maintenance backlog and long-term risk.</p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">Calculating projections...</div>
        ) : (
          <div className="h-80 w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plan} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" />
                <Bar dataKey="maintenanceCost" name="Maintenance Baseline" stackId="a" fill="#94a3b8" radius={[0, 0, 4, 4]} />
                <Bar dataKey="replacementCost" name="Funded Replacements" stackId="a" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deferredCost" name="Deferred Cost (Risk)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {plan.map(p => (
            <div key={p.year} className={`p-4 rounded-xl border ${p.deferredCount > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className="font-bold text-slate-800 mb-2">{p.year}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Funded:</span>
                  <span className="font-medium text-slate-900">{p.replacementsFunded} assets</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Deferred:</span>
                  <span className={`font-medium ${p.deferredCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{p.deferredCount} assets</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
