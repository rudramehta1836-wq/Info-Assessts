import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertTriangle, CheckCircle, Search, ArrowRight, Loader2 } from 'lucide-react';
import classNames from 'classnames';
import { api } from '../api';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function CitizenPortal() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  
  // Custom pin icon for the user dropping a pin
  const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position || !issueType) return;
    
    setLoading(true);
    try {
      const res = await api.post('/citizen-reports', {
        issue_type: issueType,
        lat: position[0],
        lng: position[1],
        description
      });
      setTrackingId(res.data.tracking_id);
      setStep(3);
    } catch (err) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-indigo-600 text-white p-4 shadow-lg z-10 relative">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-indigo-200" />
            <h1 className="text-xl font-bold tracking-tight">CityWorks Citizen Reporter</h1>
          </div>
          <div className="text-indigo-200 text-sm font-medium">Public Portal</div>
        </div>
      </div>
      
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        
        {step === 1 && (
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[70vh]">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800">Where is the issue?</h2>
              <p className="text-slate-500 mt-1">Tap or click on the map to drop a pin at the exact location.</p>
            </div>
            <div className="flex-1 relative z-0">
              <MapContainer center={[23.0225, 72.5714]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker position={position} setPosition={setPosition} />
                {position && <Marker position={position} icon={customIcon} />}
              </MapContainer>
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                {position ? 'Location selected' : 'Waiting for selection...'}
              </div>
              <button 
                onClick={() => setStep(2)}
                disabled={!position}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">What's the problem?</h2>
                <p className="text-slate-500 mt-1">Provide details so our crews can fix it fast.</p>
              </div>
              <button onClick={() => setStep(1)} className="text-indigo-600 font-medium hover:underline text-sm">
                Change Location
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Issue Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Pothole', 'Streetlight Out', 'Water Leak', 'Fallen Tree', 'Broken Pavement', 'Other'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIssueType(type)}
                      className={classNames(
                        "py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-center",
                        issueType === type 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us what you see. Are there any hazards? e.g., 'Deep pothole in the right lane'"
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={loading || !issueType || !description}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Submitting...</> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center p-12">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Report Received!</h2>
            <p className="text-slate-600 mb-8">Thank you for helping keep our city safe. Your report has been dispatched to our triage team.</p>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Your Tracking ID</p>
              <p className="text-3xl font-black text-indigo-600 font-mono tracking-widest">{trackingId}</p>
            </div>
            
            <button 
              onClick={() => { setStep(1); setPosition(null); setIssueType(''); setDescription(''); }}
              className="text-indigo-600 font-bold hover:underline"
            >
              Submit Another Report
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
