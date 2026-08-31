import React, { useState, useEffect } from 'react';
import { fetchSatellitePasses } from '../../global_utils/api';
import { getConstellationColor } from './ColorHelper';
import { X, Clock, Navigation, Compass, AlertCircle } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
export default function VisibilityTimeline({
  lat = 33.6844,
  lng = 73.0479,
  alt = 540.0,
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  const [passes, setPasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSatellitePasses(lat, lng, alt, mask, systemFilter, timeStr);
        if (isMounted) setPasses(data.passes || []);
      } catch (err) {
        console.error('Failed to fetch satellite passes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [lat, lng, alt, mask, systemFilter, timeStr]);

  // Group passes by constellation
  const grouped = React.useMemo(() => {
    const map = {};
    passes.forEach(p => {
      const c = p.constellation === 'IRNSS' ? 'NavIC' : p.constellation;
      if (!map[c]) map[c] = [];
      map[c].push(p);
    });
    return map;
  }, [passes]);

  return (
    <div className="panel-box full-width-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Panel D: GNSS Pass / Visibility Window Timeline (±6 Hours)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge-cyan">{passes.length} Total Passes</span>
          <span className="badge-dim">Mask: {mask}°</span>
        </div>
      </div>

      <div className="panel-box-body timeline-container" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '12px' }}>
        {loading && passes.length === 0 && (
          <div className="panel-loading">Calculating satellite pass trajectories...</div>
        )}

        {Object.keys(grouped).length === 0 && !loading && (
          <div className="panel-empty">No satellite pass windows found for selected filter.</div>
        )}

        {Object.entries(grouped).map(([constellation, items]) => {
          const color = getConstellationColor(constellation === 'NavIC' ? 'IRNSS' : constellation);
          return (
            <div key={constellation} className="timeline-row">
              <div className="timeline-label" style={{ borderLeft: `3px solid ${color}` }}>
                <span className="const-name" style={{ color }}>{constellation}</span>
                <span className="pass-count">({items.length})</span>
              </div>

              <div className="timeline-track">
                {items.slice(0, 14).map((pass, idx) => {
                  const durationPct = Math.min(100, Math.max(12, (pass.duration_mins / 180) * 100));

                  return (
                    <div
                      key={`pass-${idx}`}
                      className="pass-bar"
                      style={{
                        width: `${durationPct}%`,
                        borderColor: color,
                        backgroundColor: `${color}25`
                      }}
                      onClick={() => setSelectedPass(pass)}
                      title={`Click for detail: ${pass.prn} (${pass.aos} - ${pass.los})`}
                    >
                      <span className="pass-prn" style={{ color }}>{pass.prn}</span>
                      <span className="pass-el">{pass.max_el}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Satellite Pass Detail Modal */}
      {selectedPass && (
        <div className="modal-overlay" onClick={() => setSelectedPass(null)}>
          <div className="pass-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <span className="card-title" style={{ color: getConstellationColor(selectedPass.constellation) }}>
                Satellite Pass Detail — {selectedPass.prn}
              </span>
              <button className="close-btn" onClick={() => setSelectedPass(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="card-body">
              <div className="detail-row">
                <span className="label">System:</span>
                <span className="val bold">{selectedPass.constellation} {selectedPass.prn}</span>
              </div>

              <div className="detail-row">
                <span className="label"><Clock size={12} /> AOS (Acquisition of Signal):</span>
                <span className="val cyan">{selectedPass.aos}</span>
              </div>

              <div className="detail-row">
                <span className="label"><Navigation size={12} /> Max Elevation:</span>
                <span className="val green">{selectedPass.max_el}° @ {selectedPass.max_el_time}</span>
              </div>

              <div className="detail-row">
                <span className="label"><Clock size={12} /> LOS (Loss of Signal):</span>
                <span className="val yellow">{selectedPass.los}</span>
              </div>

              <div className="detail-row">
                <span className="label">Pass Duration:</span>
                <span className="val">{selectedPass.duration_mins} min</span>
              </div>

              <div className="detail-row">
                <span className="label"><Compass size={12} /> Azimuth AOS:</span>
                <span className="val">{selectedPass.azimuth_aos}°</span>
              </div>

              <div className="detail-row">
                <span className="label"><Compass size={12} /> Azimuth LOS:</span>
                <span className="val">{selectedPass.azimuth_los}°</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
