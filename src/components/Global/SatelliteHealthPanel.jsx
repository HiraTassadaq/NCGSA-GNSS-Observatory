import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Download, Search, CheckCircle2, Crosshair } from 'lucide-react';
import { CONSTELLATION_COLORS } from './CesiumGlobe';
import { saveAs } from 'file-saver';
import '../../dashboard/Stylesheet/global.css';
export default function SatelliteHealthPanel({
  satellites = [],
  selectedSatellite = null,
  onSelectSatellite = () => {},
  onFlyToSatellite = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConstellation, setFilterConstellation] = useState('ALL');
  const [filterHealthOnly, setFilterHealthOnly] = useState(false);

  const totalCount = satellites.length;
  const healthyCount = satellites.filter(s => s.isHealthy).length;
  const degradedCount = totalCount - healthyCount;

  // Filtered satellite list
  const filteredSatellites = satellites.filter(sat => {
    if (!sat) return false;
    const matchesSearch = sat.prn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sat.constellation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConst = filterConstellation === 'ALL' || sat.constellation === filterConstellation;
    const matchesHealth = !filterHealthOnly || sat.isHealthy;
    return matchesSearch && matchesConst && matchesHealth;
  });

  // CSV Export Function
  const handleExportCSV = () => {
    if (satellites.length === 0) return;

    let csvContent = 'PRN,Constellation,Health_Status,Health_Code,Clock_Bias_sec,Latitude_deg,Longitude_deg,Altitude_km,Inclination_deg,Ephemeris_Epoch\n';
    
    satellites.forEach(s => {
      csvContent += `${s.prn},${s.constellation},${s.isHealthy ? 'Healthy' : 'Degraded'},${s.healthText},${s.clockBias || 0},${s.lat ? s.lat.toFixed(4) : 0},${s.lon ? s.lon.toFixed(4) : 0},${s.alt ? (s.alt / 1000).toFixed(2) : 0},${s.inclinationDeg ? s.inclinationDeg.toFixed(2) : 0},${s.epoch ? s.epoch.toISOString() : ''}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `GNSS_Constellation_Health_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      padding: '20px',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Top Banner: Health Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={28} style={{ color: '#10b981' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Healthy Satellites</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#34d399' }}>{healthyCount} / {totalCount}</div>
          </div>
        </div>

        <div style={{ background: degradedCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)', border: degradedCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={28} style={{ color: degradedCount > 0 ? '#ef4444' : '#64748b' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Degraded / Warning</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: degradedCount > 0 ? '#f87171' : '#94a3b8' }}>{degradedCount}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '6px 12px', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search PRN or constellation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={filterConstellation}
            onChange={(e) => setFilterConstellation(e.target.value)}
            style={{ background: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: '600' }}
          >
            <option value="ALL">All Constellations</option>
            <option value="GPS">GPS</option>
            <option value="GLONASS">GLONASS</option>
            <option value="Galileo">Galileo</option>
            <option value="BeiDou">BeiDou</option>
            <option value="QZSS">QZSS</option>
            <option value="SBAS">SBAS</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: '#cbd5e1' }}>
            <input type="checkbox" checked={filterHealthOnly} onChange={(e) => setFilterHealthOnly(e.target.checked)} />
            <span>Healthy Only</span>
          </label>
        </div>
      </div>

      {/* Satellite Health Table */}
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255, 255, 255, 0.05)', position: 'sticky', top: 0, backdropFilter: 'blur(8px)' }}>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <th style={{ padding: '10px 12px' }}>PRN</th>
              <th style={{ padding: '10px 12px' }}>Constellation</th>
              <th style={{ padding: '10px 12px' }}>Health Status</th>
              <th style={{ padding: '10px 12px' }}>Altitude (km)</th>
              <th style={{ padding: '10px 12px' }}>Inclination</th>
              <th style={{ padding: '10px 12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSatellites.map((sat) => {
              const isSelected = selectedSatellite && selectedSatellite.prn === sat.prn;
              const constColor = CONSTELLATION_COLORS[sat.constellation] || '#ffffff';

              return (
                <tr
                  key={sat.prn}
                  onClick={() => onSelectSatellite(sat)}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <td style={{ padding: '8px 12px', fontWeight: '700', color: constColor }}>
                    {sat.prn}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>
                    {sat.constellation}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      background: sat.isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: sat.isHealthy ? '#34d399' : '#f87171',
                      border: sat.isHealthy ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {sat.isHealthy ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {sat.healthText || (sat.isHealthy ? 'Healthy' : 'Unhealthy')}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {sat.alt ? (sat.alt / 1000).toFixed(0) : '-'} km
                  </td>
                  <td style={{ padding: '8px 12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {sat.inclinationDeg ? sat.inclinationDeg.toFixed(1) : '-'}°
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSatellite(sat);
                        onFlyToSatellite(sat.prn);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Crosshair size={12} />
                      <span>Focus</span>
                    </button>
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
