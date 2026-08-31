import React from 'react';
import { getConstellationColor } from './ColorHelper';
import { Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
export default function WhatsOverheadTable({ satellites = [] }) {
  const visibleSats = satellites.filter(s => s.visible !== false);

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Panel A: What's Overhead @ NCGSA/IST</span>
        <span className="badge-cyan">{visibleSats.length} Sats In View</span>
      </div>

      <div className="panel-box-body" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <table className="overhead-table">
          <thead>
            <tr>
              <th>PRN</th>
              <th>Const</th>
              <th>El (°)</th>
              <th>Az (°)</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {visibleSats.map((sat, idx) => {
              const color = getConstellationColor(sat.constellation);
              const isHealthy = sat.health?.status === 'active' || sat.health?.status === 'healthy';

              return (
                <tr key={`oh-${idx}`}>
                  <td style={{ color: '#ffffff', fontWeight: 'bold' }}>{sat.prn}</td>
                  <td style={{ color }}>{sat.constellation}</td>
                  <td>{sat.elevation}°</td>
                  <td>{sat.azimuth}°</td>
                  <td>
                    {isHealthy ? (
                      <span className="status-badge active"><ShieldCheck size={10} /> Healthy</span>
                    ) : (
                      <span className="status-badge standby"><ShieldAlert size={10} /> Standby</span>
                    )}
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
