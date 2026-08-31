import React from 'react';
import { Award, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
export default function CurrentDopPanel({ telemetry }) {
  const dop = telemetry?.dop || {};

  const gdop = dop.gdop || 1.85;
  const pdop = dop.pdop || 1.42;
  const hdop = dop.hdop || 0.88;
  const vdop = dop.vdop || 1.12;
  const tdop = dop.tdop || 0.74;

  let quality = { label: 'Excellent', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle2 };
  if (pdop > 2.0 && pdop <= 5.0) {
    quality = { label: 'Good', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', icon: CheckCircle2 };
  } else if (pdop > 5.0 && pdop <= 10.0) {
    quality = { label: 'Fair', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: AlertTriangle };
  } else if (pdop > 10.0) {
    quality = { label: 'Poor', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertCircle };
  }

  const QualityIcon = quality.icon;

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Panel C: Current DOP @ NCGSA/IST</span>
        <span className="badge-cyan">Live 1 Hz</span>
      </div>

      <div className="panel-box-body" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Quality Indicator Badge */}
        <div className="dop-quality-badge" style={{ backgroundColor: quality.bg, border: `1px solid ${quality.color}` }}>
          <QualityIcon size={20} style={{ color: quality.color }} />
          <div>
            <span className="badge-title" style={{ color: quality.color }}>GEOMETRY QUALITY: {quality.label.toUpperCase()}</span>
            <span className="badge-sub">PDOP = {pdop.toFixed(2)}</span>
          </div>
        </div>

        {/* Live DOP Metrics List */}
        <div className="dop-metric-grid">
          <div className="dop-card">
            <span className="dop-name">GDOP (Geometric)</span>
            <span className="dop-val cyan">{gdop.toFixed(2)}</span>
          </div>
          <div className="dop-card active-pdop">
            <span className="dop-name">PDOP (Position)</span>
            <span className="dop-val green">{pdop.toFixed(2)}</span>
          </div>
          <div className="dop-card">
            <span className="dop-name">HDOP (Horizontal)</span>
            <span className="dop-val yellow">{hdop.toFixed(2)}</span>
          </div>
          <div className="dop-card">
            <span className="dop-name">VDOP (Vertical)</span>
            <span className="dop-val blue">{vdop.toFixed(2)}</span>
          </div>
          <div className="dop-card">
            <span className="dop-name">TDOP (Time)</span>
            <span className="dop-val purple">{tdop.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
