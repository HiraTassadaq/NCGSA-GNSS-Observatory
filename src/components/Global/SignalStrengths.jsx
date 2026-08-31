import React from 'react';
import { getConstellationColor } from './ColorHelper';
import '../../dashboard/Stylesheet/global.css';
const CONST_ORDER = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'IRNSS', 'QZSS', 'Other'];


export default function SignalStrengths({ visibleSatellites = [], style = {} }) {
  const grouped = {};
  CONST_ORDER.forEach(c => grouped[c] = []);
  visibleSatellites.forEach(s => {
    const key = CONST_ORDER.includes(s.constellation) ? s.constellation : 'Other';
    grouped[key].push(s);
  });

  const sorted = CONST_ORDER.flatMap(c => grouped[c] || []);

  return (
    <div className="glass-panel" style={{ height: '100%', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Signal Strength (C/N0 dB-Hz)</h3>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
          Strong: 40+ | Good: 30-40 | Weak: &lt;30
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        {CONST_ORDER.map(c => {
          const cnt = (grouped[c] || []).length;
          if (cnt === 0) return null;
          const color = getConstellationColor(c);
          return (
            <span key={c} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '0.7rem', fontWeight: '600',
              padding: '2px 10px', borderRadius: '12px',
              background: `${color}18`, border: `1px solid ${color}33`,
              color,
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
              {c} ({cnt})
            </span>
          );
        })}
      </div>
      
      {sorted.length > 0 ? (
        <div className="snr-bars-container" style={{ height: '200px' }}>
          {sorted.map((sat, idx) => {
            const snrPercent = (sat.snr / 52.0) * 100;
            const color = getConstellationColor(sat.constellation);
            return (
              <div key={`snr-${idx}`} className="snr-bar-wrapper">
                <div 
                  className="snr-bar-fill" 
                  data-snr={`${sat.snr} dB-Hz`}
                  style={{ 
                    height: `${snrPercent}%`, 
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}80` 
                  }}
                />
                <span className="snr-bar-label">{sat.prn}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No visible satellites to plot. Try decreasing elevation mask.
        </div>
      )}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: '1.3' }}>
        Carrier-to-Noise Ratio (C/N0) values computed from line-of-sight geometry and atmospheric attenuation models.
      </p>
    </div>
  );
}
