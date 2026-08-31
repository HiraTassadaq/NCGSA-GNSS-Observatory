import React from 'react';
import { getConstellationColor } from './ColorHelper';
import '../../dashboard/Stylesheet/global.css';const CONSTELLATIONS = [
  { id: 'GPS', name: 'GPS (USA)', max: 32 },
  { id: 'Galileo', name: 'Galileo (EU)', max: 30 },
  { id: 'BeiDou', name: 'BeiDou (China)', max: 45 },
  { id: 'GLONASS', name: 'GLONASS (Russia)', max: 24 },
  { id: 'IRNSS', name: 'NavIC (India)', max: 8 },
  { id: 'QZSS', name: 'QZSS (Japan)', max: 4 },
  { id: 'SBAS', name: 'SBAS Overlay', max: 12 }
];

export default function PakistanConstellationStatus({ telemetry }) {
  const summary = telemetry?.summary || {};

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Panel D: Constellation Status Over Pakistan</span>
        <span className="badge-cyan">Live Table & Chart</span>
      </div>

      <div className="panel-box-body" style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <table className="const-status-table">
          <thead>
            <tr>
              <th>System</th>
              <th>Visible</th>
              <th>Constellation Bar</th>
            </tr>
          </thead>
          <tbody>
            {CONSTELLATIONS.map(c => {
              const count = summary[c.id] || 0;
              const color = getConstellationColor(c.id);
              const pct = Math.min(100, Math.round((count / c.max) * 100));

              return (
                <tr key={c.id}>
                  <td>
                    <span style={{ color, fontWeight: 'bold' }}>{c.id === 'IRNSS' ? 'NavIC' : c.id}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#fff' }}>{count}</strong> <span style={{ color: '#64748b', fontSize: '0.72rem' }}>visible</span>
                  </td>
                  <td style={{ width: '55%' }}>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
