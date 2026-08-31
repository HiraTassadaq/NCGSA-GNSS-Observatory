import React from 'react';
import { Clock, Layers } from 'lucide-react';
import '../dashboardStyle.css';
export default function StatsCards({ telemetry, satellites = [] }) {
  return (
    <div className="mini-stats-bar">
      <div className="mini-stat-chip">
        <Clock size={13} style={{ color: '#10b981' }} />
        <span className="mini-stat-label">GPS Time</span>
        <span className="mini-stat-value">
          {telemetry ? `Wk ${telemetry.gps_time.week} · TOW ${Math.floor(telemetry.gps_time.tow)}` : '—'}
        </span>
      </div>

      <div className="mini-stat-chip">
        <Layers size={13} style={{ color: '#f59e0b' }} />
        <span className="mini-stat-label">TEC & Delay</span>
        <span className="mini-stat-value">
          {satellites.length > 0
            ? `${satellites[0].tec.stec.toFixed(1)} TECU · L1 ${satellites[0].tec.delay_l1_m.toFixed(2)}m`
            : '0.0 TECU'}
        </span>
      </div>
    </div>
  );
}
