import React, { useState, useEffect } from 'react';
import { fetchAnalytics24h } from '../../global_utils/api';
import { getConstellationColor } from './ColorHelper';
import { Activity, BarChart2, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
export default function AnalyticsStrip({
  lat = 33.6560,
  lng = 73.1560,
  alt = 540.0,
  mask = 10.0,
  timeStr = ''
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeConst, setActiveConst] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAnalytics24h(lat, lng, alt, mask, timeStr);
        if (isMounted) setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch 24h analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [lat, lng, alt, mask, timeStr]);

  const times = analytics?.times || [];
  const visSeries = analytics?.total_visible || [];
  const pdopSeries = analytics?.pdop_series || [];
  const comparisonTable = analytics?.comparison_table || [];
  const constSeries = analytics?.constellation_series || {};

  // Find Peak and Valley
  let maxVis = 0, maxIdx = 0, minVis = 999, minIdx = 0;
  visSeries.forEach((v, idx) => {
    if (v > maxVis) { maxVis = v; maxIdx = idx; }
    if (v < minVis) { minVis = v; minIdx = idx; }
  });

  return (
    <div className={`analytics-bottom-strip ${collapsed ? 'collapsed' : ''}`}>
      {/* Header Bar */}
      <div className="strip-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="strip-header-left">
          <Activity size={14} style={{ color: '#06b6d4' }} />
          <span className="strip-title">VIEW 5: 24-Hour Analytics & Multi-GNSS Comparison</span>
        </div>
        <div className="strip-header-right">
          <span className="badge-cyan">24h Continuous Analysis</span>
          <button className="strip-toggle-btn">
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="strip-content-grid">
          {/* Chart 1: Satellite Visibility (24h) */}
          <div className="analytics-card">
            <div className="card-mini-title">
              <span>Satellite Visibility (24h)</span>
              {times[maxIdx] && (
                <span className="badge-peak">Peak: {maxVis} @ {times[maxIdx]}</span>
              )}
              {times[minIdx] && (
                <span className="badge-valley">Valley: {minVis} @ {times[minIdx]}</span>
              )}
            </div>

            <div className="svg-chart-container">
              <svg viewBox="0 0 320 80" preserveAspectRatio="none" className="analytics-svg">
                {/* SVG Line path */}
                {visSeries.length > 1 && (
                  <path
                    d={visSeries.map((v, i) => {
                      const x = (i / (visSeries.length - 1)) * 320;
                      const y = 75 - (v / 40) * 65;
                      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                )}
                {/* Peak dot */}
                {visSeries.length > 0 && (
                  <circle
                    cx={(maxIdx / (visSeries.length - 1)) * 320}
                    cy={75 - (maxVis / 40) * 65}
                    r="4"
                    fill="#22c55e"
                  />
                )}
                {/* Valley dot */}
                {visSeries.length > 0 && (
                  <circle
                    cx={(minIdx / (visSeries.length - 1)) * 320}
                    cy={75 - (minVis / 40) * 65}
                    r="4"
                    fill="#ef4444"
                  />
                )}
              </svg>
              <div className="chart-x-labels">
                <span>{times[0] || '-12h'}</span>
                <span>{times[Math.floor(times.length / 2)] || 'NOW'}</span>
                <span>{times[times.length - 1] || '+12h'}</span>
              </div>
            </div>
          </div>

          {/* Chart 2: DOP (24h) with Quality Bands */}
          <div className="analytics-card">
            <div className="card-mini-title">
              <span>PDOP Geometry Quality (24h)</span>
              <span className="quality-legend">
                <span style={{ color: '#22c55e' }}>● Excel (&lt;2)</span>
                <span style={{ color: '#eab308' }}>● Fair (2–5)</span>
                <span style={{ color: '#ef4444' }}>● Poor (&gt;5)</span>
              </span>
            </div>

            <div className="svg-chart-container">
              <svg viewBox="0 0 320 80" preserveAspectRatio="none" className="analytics-svg">
                {/* Quality Band background zones */}
                <rect x="0" y="45" width="320" height="30" fill="rgba(34, 197, 94, 0.08)" />
                <rect x="0" y="20" width="320" height="25" fill="rgba(234, 179, 8, 0.08)" />
                <rect x="0" y="0" width="320" height="20" fill="rgba(239, 68, 68, 0.08)" />

                {/* PDOP Line */}
                {pdopSeries.length > 1 && (
                  <path
                    d={pdopSeries.map((v, i) => {
                      const x = (i / (pdopSeries.length - 1)) * 320;
                      const y = Math.max(5, Math.min(75, 75 - (v / 6) * 60));
                      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                )}
              </svg>
              <div className="chart-x-labels">
                <span>{times[0] || '-12h'}</span>
                <span>{times[Math.floor(times.length / 2)] || 'NOW'}</span>
                <span>{times[times.length - 1] || '+12h'}</span>
              </div>
            </div>
          </div>

          {/* Table: Multi-GNSS Comparison Table */}
          <div className="analytics-card comparison-table-card">
            <div className="card-mini-title">Multi-GNSS Comparison Table</div>
            <div className="comparison-table-wrapper">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>System</th>
                    <th>Visible</th>
                    <th>Avg Elev</th>
                    <th>PDOP</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, idx) => {
                    const isMulti = row.system === 'Multi-GNSS';
                    const color = isMulti
                      ? '#06b6d4'
                      : getConstellationColor(row.system === 'NavIC' ? 'IRNSS' : row.system);

                    return (
                      <tr key={`cmp-${idx}`} className={isMulti ? 'multi-gnss-row' : ''}>
                        <td style={{ color, fontWeight: 'bold' }}>{row.system}</td>
                        <td>{row.visible}</td>
                        <td>{row.avg_elev}°</td>
                        <td>
                          <span style={{ color: row.pdop <= 2.0 ? '#22c55e' : '#eab308' }}>
                            {row.pdop}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
