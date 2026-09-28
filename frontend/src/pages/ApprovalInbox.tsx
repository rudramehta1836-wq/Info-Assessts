import { useState, useEffect } from 'react';
import { api } from '../api';
import { Check, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Approval = {
  id: number;
  type: string;
  reference_id: string;
  payload: string;
  requester_name: string;
  created_at: string;
};

export default function ApprovalInbox() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState<{ [key: number]: string }>({});
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecide = async (id: number, decision: 'Approved' | 'Rejected') => {
    setProcessing(id);
    try {
      await api.post(`/approvals/${id}/decide`, { decision, comments: comment[id] || '' });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to process approval');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Manager Approvals</h1>
        <p className="text-slate-500">Review and authorize critical system changes</p>
      </div>

      {approvals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 border-dashed p-12">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">All caught up!</h2>
          <p className="text-slate-500 mt-2">There are no pending approvals requiring your attention.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-12 overflow-y-auto">
          {approvals.map(approval => {
            const payload = JSON.parse(approval.payload);
            return (
              <div key={approval.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                        {approval.type === 'LifecycleTransition' ? 'State Change' : approval.type}
                      </span>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Requested by <span className="font-semibold text-slate-700">{approval.requester_name}</span> {formatDistanceToNow(new Date(approval.created_at))} ago
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                      Request on Asset <span className="text-indigo-600">{approval.reference_id}</span>
                    </h3>
                    
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                      {approval.type === 'LifecycleTransition' && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Transition state from:</p>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold bg-white border border-slate-200 px-3 py-1 rounded text-slate-700">{payload.from_state}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-semibold bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded shadow-sm">{payload.to_state}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-3 italic">Reason: "{payload.reason}"</p>
                        </div>
                      )}
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder="Add optional manager comment..." 
                      value={comment[approval.id] || ''}
                      onChange={e => setComment({...comment, [approval.id]: e.target.value})}
                      className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  
                  <div className="md:w-48 flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <button 
                      onClick={() => handleDecide(approval.id, 'Approved')}
                      disabled={processing === approval.id}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" /> Approve
                    </button>
                    <button 
                      onClick={() => handleDecide(approval.id, 'Rejected')}
                      disabled={processing === approval.id}
                      className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-100 hover:bg-red-50 text-red-600 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      <X className="w-5 h-5" /> Reject
                    </button>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
