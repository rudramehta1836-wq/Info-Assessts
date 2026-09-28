import { useState } from 'react';
import { api } from '../api';
import { X } from 'lucide-react';

export default function CreateAssetModal({ isOpen, onClose, onCreated, userRole }: { isOpen: boolean, onClose: () => void, onCreated: () => void, userRole: string }) {
  const [formData, setFormData] = useState({
    id: '', category: '', description: '', lat: '', lng: '', ward: '', address: '',
    install_date: '', cost: '', vendor: '', expected_useful_life_years: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  if (userRole !== 'Manager' && userRole !== 'Inspector') {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">Only Managers and Inspectors can register new assets.</p>
          <button onClick={onClose} className="w-full bg-slate-100 text-slate-800 py-2 rounded-lg font-medium hover:bg-slate-200">Close</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/assets', {
        ...formData,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        cost: parseFloat(formData.cost),
        expected_useful_life_years: parseInt(formData.expected_useful_life_years)
      });
      onCreated();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Register New Asset</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asset ID</label>
              <input required type="text" placeholder="e.g. BR-001" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category (Dynamic)</label>
              <input required list="categories" placeholder="Type or select..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <datalist id="categories">
                <option value="Streetlight" />
                <option value="Road Segment" />
                <option value="Bridge" />
                <option value="Traffic Signal" />
                <option value="Water Main" />
                <option value="Sewer Line" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ward</label>
              <select required value={formData.ward} onChange={e => setFormData({...formData, ward: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select Ward...</option>
                {['Navrangpura', 'Paldi', 'Ellisbridge', 'Thaltej', 'Bodakdev', 'Vastrapur', 'Bopal', 'Gota', 'Chandkheda', 'Maninagar'].map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address/Location</label>
              <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
              <input required type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
              <input required type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Install Date</label>
              <input required type="date" value={formData.install_date} onChange={e => setFormData({...formData, install_date: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Useful Life (Years)</label>
              <input required type="number" value={formData.expected_useful_life_years} onChange={e => setFormData({...formData, expected_useful_life_years: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
              <input required type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor (Optional)</label>
              <input type="text" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24" placeholder="Detailed description of the asset..." />
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors">
              {loading ? 'Creating...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
