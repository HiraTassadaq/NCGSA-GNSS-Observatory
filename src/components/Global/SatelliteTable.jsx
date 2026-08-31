import React from 'react';
import { getConstellationColor, getHealthColor } from './ColorHelper';
import '../../dashboard/Stylesheet/global.css';
export default function SatelliteTable({ 
  satellites, selectedSatellite, onSelectSatellite, filterConstellations, setFilterConstellations,
  compact = false
}) {

  if (compact) {
    return (
      <div className="panel-box">
        <div className="panel-box-header">
          <span className="panel-box-title">Satellite Details</span>
          <div className="compact-filter-chips">
            {Object.keys(filterConstellations).map(c => (
              <label key={c} className="compact-filter-chip" style={{ color: getConstellationColor(c) }}>
                <input
                  type="checkbox"
                  checked={filterConstellations[c]}
                  onChange={() => setFilterConstellations({ ...filterConstellations, [c]: !filterConstellations[c] })}
                  style={{ accentColor: getConstellationColor(c), margin: 0 }}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="panel-box-body compact-table-scroll">
          <table className="telemetry-table compact-telemetry-table">
            <thead>
              <tr>
                <th>PRN</th>
                <th>Const</th>
                <th>Health</th>
                <th>El</th>
                <th>Az</th>
                <th>Doppler</th>
                <th>Rate</th>
                <th>SNR</th>
              </tr>
            </thead>
            <tbody>
              {satellites.map((sat, idx) => (
                <tr
                  key={idx}
                  className={selectedSatellite?.prn === sat.prn ? 'selected-row' : ''}
                  onClick={() => onSelectSatellite(sat)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{sat.prn}</td>
                  <td>
                    <span className={`constellation-tag const-${sat.constellation.toLowerCase()}`}>
                      {sat.constellation}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase',
                      color: getHealthColor(sat.health?.status)
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: getHealthColor(sat.health?.status),
                        boxShadow: `0 0 5px ${getHealthColor(sat.health?.status)}`
                      }} />
                      {sat.health?.status || 'unknown'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{sat.elevation}°</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{sat.azimuth}°</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: sat.doppler.doppler_l1 >= 0 ? '#4ade80' : '#f87171' }}>
                    {sat.doppler.doppler_l1 >= 0 ? '+' : ''}{Math.round(sat.doppler.doppler_l1)} Hz
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(sat.range_rate_ms / 1000).toFixed(2)} km/s</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent)' }}>{sat.snr} dB</td>
                </tr>
              ))}
            </tbody>
          </table>
          {satellites.length === 0 && (
            <div className="panel-loading">No satellites match the current filters.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Active GNSS Satellites Tracking Status</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.keys(filterConstellations).map(c => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={filterConstellations[c]} 
                onChange={() => setFilterConstellations({ ...filterConstellations, [c]: !filterConstellations[c] })}
                style={{ accentColor: getConstellationColor(c) }}
              />
              <span style={{ color: getConstellationColor(c), fontWeight: '600' }}>{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>PRN</th>
              <th>Constellation</th>
              <th>Health</th>
              <th>Elevation</th>
              <th>Azimuth</th>
              <th>Doppler (L1)</th>
              <th>Range Rate</th>
              <th>SNR (C/N0)</th>
            </tr>
          </thead>
          <tbody>
            {satellites.map((sat, idx) => (
              <tr 
                key={idx} 
                className={selectedSatellite?.prn === sat.prn ? 'selected-row' : ''} 
                onClick={() => onSelectSatellite(sat)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{sat.prn}</td>
                <td>
                  <span className={`constellation-tag const-${sat.constellation.toLowerCase()}`}>
                    {sat.constellation}
                  </span>
                </td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
                    color: getHealthColor(sat.health?.status)
                  }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: getHealthColor(sat.health?.status),
                      boxShadow: `0 0 5px ${getHealthColor(sat.health?.status)}`
                    }} />
                    {sat.health?.status || 'unknown'}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{sat.elevation}°</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{sat.azimuth}°</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: sat.doppler.doppler_l1 >= 0 ? '#4ade80' : '#f87171' }}>
                  {sat.doppler.doppler_l1 >= 0 ? '+' : ''}{Math.round(sat.doppler.doppler_l1)} Hz
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{(sat.range_rate_ms / 1000).toFixed(2)} km/s</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent)' }}>{sat.snr} dB-Hz</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
