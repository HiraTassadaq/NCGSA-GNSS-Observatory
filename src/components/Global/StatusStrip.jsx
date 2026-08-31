import React from 'react';
import { getConstellationColor } from './ColorHelper';
import '../../dashboard/Stylesheet/global.css';
const SYSTEM_PILLS = ['GPS', 'Galileo', 'BeiDou', 'GLONASS', 'NavIC', 'QZSS', 'SBAS'];

export default function StatusStrip({
  telemetry,
  activeSystems,
  onToggleSystem
}) {
  const summary = telemetry?.summary || {};
  const totalCatalog = telemetry?.total_catalog || {};

  const totalSatellites = Object.values(totalCatalog).reduce((a, b) => a + b, 0) || 120;
  const inViewCount = summary.total_visible || 0;
  const pdopVal = telemetry?.dop?.pdop ? telemetry.dop.pdop.toFixed(2) : '1.45';

  // Average VTEC estimate
  const sampleTec = telemetry?.satellites?.[0]?.tec?.vtec
    ? Math.round(telemetry.satellites[0].tec.vtec)
    : 24;

  return (
    <div className="gnss-status-strip">
      <div className="status-metric-cell">
        <span className="metric-label">SATELLITES</span>
        <span className="metric-value">{totalSatellites} <span className="sub-unit">total active</span></span>
      </div>

      {/* <div className="status-metric-cell highlight">
        <span className="metric-label">IN VIEW</span>
        <span className="metric-value cyan">{inViewCount} <span className="sub-unit">above mask</span></span>
      </div> */}

      {/* <div className="status-metric-cell">
        <span className="metric-label">PDOP</span>
        <span className="metric-value green">{pdopVal}</span>
      </div> */}

      <div className="status-metric-cell">
        <span className="metric-label">TEC</span>
        <span className="metric-value yellow">{sampleTec} <span className="sub-unit">TECU</span></span>
      </div>

      {/* System Pills */}
      <div className="system-pills-container">
        {SYSTEM_PILLS.map(sys => {
          const color = getConstellationColor(sys === 'NavIC' ? 'IRNSS' : sys);
          const isActive = activeSystems ? activeSystems[sys] !== false : true;
          const count = summary[sys === 'NavIC' ? 'IRNSS' : sys] || 0;

          return (
            <button
              key={sys}
              className={`system-pill ${isActive ? 'active' : 'inactive'}`}
              style={{
                borderColor: isActive ? color : 'rgba(255,255,255,0.1)',
                color: isActive ? '#ffffff' : '#64748b',
                backgroundColor: isActive ? `${color}1a` : 'rgba(15,23,42,0.4)'
              }}
              onClick={() => onToggleSystem && onToggleSystem(sys)}
            >
              <span className="pill-dot" style={{ backgroundColor: isActive ? color : '#64748b' }} />
              <span className="pill-name">{sys}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
