import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import classNames from 'classnames';

// Fix leaflet icon issue in react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AssetDetail({ user: _user }: { user?: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [intel, setIntel] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [assetRes, intelRes] = await Promise.all([
        api.get(`/assets/${id}`),
        api.get(`/assets/${id}/intelligence`)
      ]);
      setData(assetRes.data);
      setIntel(intelRes.data);
    } catch (_err) {
      setError('Not found');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleConvertWorkOrder = async () => {
    try {
      await api.post('/work-orders', {
        asset_id: data.id,
        description: `Predictive Maintenance: ${intel?.predictive?.recommendation || 'Routine Service'}`,
        priority: intel?.risk?.score && intel.risk.score > 70 ? 'Critical' : 'Medium'
      });
      alert('Work Order created successfully from predictive intelligence!');
      navigate('/work-orders');
    } catch (err) {
      console.error(err);
      alert('Failed to create work order.');
    }
  };

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8">Loading...</div>;

  const handleTransition = async (to_state: string) => {
    try {
      await api.post(`/assets/${id}/transition`, { to_state });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to transition');
    }
  };

  const VALID_TRANSITIONS: Record<string, string[]> = {
    'Planned': ['Procured', 'Decommissioned'],
    'Procured': ['Commissioned', 'Disposed'],
    'Commissioned': ['In Service', 'Decommissioned'],
    'In Service': ['Under Maintenance', 'Decommissioned'],
    'Under Maintenance': ['In Service', 'Decommissioned'],
    'Decommissioned': ['Disposed'],
    'Disposed': []
  };

  const availableTransitions = VALID_TRANSITIONS[data.status] || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.id}</h1>
          <p className="text-sm text-slate-500 mt-1">{data.category} • {data.address} ({data.ward})</p>
        </div>
        <div className="flex gap-2">
          {availableTransitions.map(state => (
            <button 
              key={state}
              onClick={() => handleTransition(state)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Transition to {state}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <p className="font-semibold text-slate-900">{data.status}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Condition Score</p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(star => (
                  <div key={star} className={classNames("w-2.5 h-2.5 rounded-full", star <= data.condition_score ? "bg-amber-400" : "bg-slate-200")} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Install Date</p>
              <p className="font-medium text-slate-900">{format(new Date(data.install_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Cost</p>
              <p className="font-medium text-slate-900">${data.cost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Expected Life</p>
              <p className="font-medium text-slate-900">{data.expected_useful_life_years} Years</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Vendor</p>
              <p className="font-medium text-slate-900">{data.vendor}</p>
            </div>
            
            {data.description && (
              <div className="col-span-2 mt-2 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{data.description}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h2 className="text-lg font-semibold text-slate-900 mb-4">Lifecycle Timeline</h2>
             <div className="space-y-4">
                {data.history.map((event: any, i: number) => (
                  <div key={event.id} className="flex gap-4 relative">
                    {i !== data.history.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-16px] w-0.5 bg-slate-200" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-indigo-100 border-4 border-white flex-shrink-0 z-10" />
                    <div className="pb-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {event.from_state ? `${event.from_state} → ${event.to_state}` : `Created as ${event.to_state}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{format(new Date(event.created_at), 'MMM d, yyyy HH:mm')} by {event.changed_by_name}</p>
                      {event.reason && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">{event.reason}</p>}
                    </div>
                  </div>
                ))}
             </div>
          </div>
          
           {intel && (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                   <div className="w-32 h-32 rounded-full border-4 border-white" />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                   <h2 className="text-xl font-bold">Predictive Intelligence</h2>
                   <div className="text-right">
                     <div className="text-4xl font-black text-indigo-400">{intel.risk.score}<span className="text-sm text-slate-400 font-normal">/100</span></div>
                     <div className="text-xs text-indigo-200 mt-1 uppercase tracking-wider font-semibold">Total Risk Score</div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Risk Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center"><span className="text-slate-400">Condition Factor</span><span className="font-bold text-red-400">+{intel.risk.breakdown.condition} pts</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">Age vs Expected Life</span><span className="font-bold text-orange-400">+{intel.risk.breakdown.age} pts</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">Overdue Maintenance</span><span className="font-bold text-yellow-400">+{intel.risk.breakdown.maintenance} pts</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">Asset Criticality</span><span className="font-bold text-pink-400">+{intel.risk.breakdown.criticality} pts</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Predicted Next Failure Window</p>
                      <p className="font-bold text-lg text-white">{intel.predictive.window}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Recommended Action</p>
                      <p className="font-bold text-indigo-300">{intel.predictive.recommendation}</p>
                    </div>
                    
                    <button 
                      onClick={handleConvertWorkOrder}
                      className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      Convert to Work Order
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-700/50 relative z-10">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Lifecycle Cost Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Acquisition Cost</p>
                      <p className="font-semibold text-slate-200">${intel.lifecycleCost.acquisitionCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Cumulative Maint.</p>
                      <p className="font-semibold text-slate-200">${intel.lifecycleCost.maintenanceCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Total Cost of Ownership</p>
                      <p className="font-semibold text-white">${intel.lifecycleCost.totalCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Depreciated Value</p>
                      <p className="font-semibold text-slate-200">${Math.round(intel.lifecycleCost.currentDepreciatedValue).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative z-0">
             <MapContainer center={[data.lat, data.lng]} zoom={15} style={{ height: '250px', width: '100%' }}>
              <TileLayer 
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
                attribution="&copy; Google Maps"
              />
              <Marker position={[data.lat, data.lng]}>
                <Popup>{data.id}</Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Work Orders</h2>
            {data.workOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No work orders recorded.</p>
            ) : (
              <div className="space-y-3">
                {data.workOrders.map((wo: any) => (
                  <div key={wo.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-slate-900">#{wo.id} - {wo.priority}</p>
                      <span className={classNames("text-xs font-semibold px-2 py-0.5 rounded", wo.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                        {wo.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{wo.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
