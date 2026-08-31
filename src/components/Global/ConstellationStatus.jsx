import React from 'react';
import { getConstellationColor } from './ColorHelper';
import '../../dashboard/Stylesheet/global.css';
const CONSTELLATIONS = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'IRNSS', 'QZSS', 'SBAS'];

export default function ConstellationStatus({ telemetry }) {
  const summary = telemetry?.summary || {};
  const totalCatalog = telemetry?.total_catalog || {};

  return (
    <div className="const-status-bar">
      <span className="const-status-title">Constellation Status</span>
      {CONSTELLATIONS.map(c => (
        <div key={c} className="const-status-cell" style={{ borderLeft: `3px solid ${getConstellationColor(c)}` }}>
          <span className="const-status-name" style={{ color: getConstellationColor(c) }}>{c}</span>
          <span className="const-status-count">
            {summary[c] ?? 0}<em>/{totalCatalog[c] ?? 0}</em>
          </span>
        </div>
      ))}
    </div>
  );
}
