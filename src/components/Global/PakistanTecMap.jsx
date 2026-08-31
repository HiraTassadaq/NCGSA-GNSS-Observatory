import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Popup } from 'react-leaflet';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { fetchPakistanGrid } from '../../global_utils/api';
import { getTecColor } from './TecColorScale';
import 'leaflet/dist/leaflet.css';
import '../../dashboard/Stylesheet/global.css';
export default function PakistanTecMap({
  mask = 10.0,
  timeStr = ''
}) {
  const [gridData, setGridData] = useState([]);
  const [hourOffset, setHourOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const base = timeStr ? new Date(timeStr) : new Date();
        base.setHours(base.getHours() + hourOffset);
        const res = await fetchPakistanGrid(mask, 'ALL', base.toISOString());
        if (isMounted) setGridData(res.points || []);
      } catch (err) {
        console.error('Failed to fetch Pakistan TEC grid:', err);
      }
    })();
    return () => { isMounted = false; };
  }, [mask, timeStr, hourOffset]);

  useEffect(() => {
    let timer = null;
    if (isAnimating) {
      timer = setInterval(() => {
        setHourOffset(prev => (prev + 1) % 24);
      }, 1200);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isAnimating]);

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title"> Pakistan TEC</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn-icon ${isAnimating ? 'active' : ''}`}
            onClick={() => setIsAnimating(!isAnimating)}
            title="Animate Daily TEC Variation"
          >
            {isAnimating ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <input
            type="range"
            min="-12"
            max="12"
            value={hourOffset}
            onChange={(e) => setHourOffset(parseInt(e.target.value))}
            style={{ width: '80px', accentColor: '#06b6d4' }}
          />
          <span style={{ fontSize: '0.7rem', color: '#06b6d4', width: '38px', fontFamily: 'var(--font-mono)' }}>
            {hourOffset >= 0 ? `+${hourOffset}h` : `${hourOffset}h`}
          </span>
        </div>
      </div>

      <div className="panel-box-body" style={{ flex: 1, minHeight: 0 }}>
        <MapContainer center={[30.0, 69.5]} zoom={5} minZoom={4} maxZoom={9} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {gridData.map((pt, idx) => {
            const tec = pt.vtec || 20;
            const color = getTecColor(tec);
            const bounds = [
              [pt.lat - 0.5, pt.lng - 0.5],
              [pt.lat + 0.5, pt.lng + 0.5]
            ];
            return (
              <Rectangle
                key={`pk-tec-${idx}`}
                bounds={bounds}
                pathOptions={{
                  color: color,
                  weight: 0.3,
                  fillColor: color,
                  fillOpacity: 0.45
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                    <strong>Location:</strong> {pt.lat}° N, {pt.lng}° E<br />
                    <strong>Vertical TEC:</strong> {tec.toFixed(1)} TECU
                  </div>
                </Popup>
              </Rectangle>
            );
          })}
        </MapContainer>
      </div>

      <div className="globe-legend">
        <span><span style={{ color: '#3b82f6' }}>■</span> &lt;10 TECU</span>
        <span><span style={{ color: '#06b6d4' }}>■</span> 10–25</span>
        <span><span style={{ color: '#eab308' }}>■</span> 25–45</span>
        <span><span style={{ color: '#ef4444' }}>■</span> &gt;45 TECU</span>
      </div>
    </div>
  );
}
