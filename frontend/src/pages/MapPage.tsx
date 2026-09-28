import { useEffect, useState } from 'react';
import { api } from '../api';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import MarkerClusterGroup from 'react-leaflet-cluster';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on status
const createIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const icons = {
  'In Service': createIcon('#10b981'), // emerald
  'Under Maintenance': createIcon('#f59e0b'), // amber
  'Decommissioned': createIcon('#64748b'), // slate
  'default': createIcon('#6366f1'), // indigo
};

export default function MapPage() {
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    api.get('/assets').then(res => setAssets(res.data));
  }, []);

  if (assets.length === 0) return <div className="p-8">Loading map...</div>;

  // Center around Ahmedabad roughly
  const center = [23.0225, 72.5714];

  return (
    <div className="h-full w-full flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Geospatial Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Interactive map of all municipal infrastructure</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative z-0">
        <MapContainer center={center as any} zoom={13} style={{ height: '600px', width: '100%' }}>
          <TileLayer 
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
            attribution="&copy; Google Maps"
          />
          
          {/* Heatmap Layer for Poor Condition Assets (Condition <= 2) */}
          {assets.filter(a => a.condition_score <= 2).map(asset => (
            <Circle 
              key={`heat-${asset.id}`} 
              center={[asset.lat, asset.lng]} 
              radius={300}
              pathOptions={{ fillColor: '#ef4444', color: 'transparent', fillOpacity: 0.4 }}
            />
          ))}

          {/* Heatmap Layer for Warning Assets (Condition == 3) */}
          {assets.filter(a => a.condition_score === 3).map(asset => (
            <Circle 
              key={`heat-${asset.id}`} 
              center={[asset.lat, asset.lng]} 
              radius={200}
              pathOptions={{ fillColor: '#f59e0b', color: 'transparent', fillOpacity: 0.2 }}
            />
          ))}

          <MarkerClusterGroup
            chunkedLoading
            polygonOptions={{ fillColor: '#6366f1', color: '#4f46e5', weight: 1, opacity: 1, fillOpacity: 0.4 }}
          >
            {assets.map(asset => {
              const icon = (icons as any)[asset.status] || icons['default'];
              return (
                <Marker key={asset.id} position={[asset.lat, asset.lng]} icon={icon}>
                  <Popup>
                    <div className="font-sans">
                      <p className="font-bold text-sm mb-1">{asset.id}</p>
                      <p className="text-xs text-slate-600">{asset.category}</p>
                      <p className="text-xs text-slate-600 font-medium">Condition: {asset.condition_score}/5</p>
                      <Link to={`/assets/${asset.id}`} className="text-indigo-600 text-xs font-medium mt-2 inline-block">
                        View Details &rarr;
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}
