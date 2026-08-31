import React from 'react';
import CustomLineChart from './CustomLineChart';
import { Activity } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
const DOP_COLORS = { gdop: '#ef4444', pdop: '#3b82f6', hdop: '#10b981', vdop: '#f59e0b', tdop: '#8b5cf6' };
const LABELS = { gdop: 'GDOP', pdop: 'PDOP', hdop: 'HDOP', vdop: 'VDOP', tdop: 'TDOP' };

export default function LiveTelemetryCharts({ history = [] }) {
  const labels = history.map(h => h.time);
  if (history.length === 0) {
    return (
      <div className="glass-panel" style={{ marginTop: '24px', padding: '32px', textAlign: 'center' }}>
        <Activity size={28} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Collecting live telemetry data...</p>
      </div>
    );
  }

  const dopDatasets = ['gdop', 'pdop', 'hdop', 'vdop', 'tdop'].map(key => ({
    label: LABELS[key],
    data: history.map(h => h[key]),
    color: DOP_COLORS[key],
  }));

  const snrDataset = [{
    label: 'Avg C/N0',
    data: history.map(h => h.avgSnr),
    color: '#06b6d4',
    fill: true,
  }];

  const dopplerDataset = [{
    label: 'Avg Doppler L1',
    data: history.map(h => h.avgDoppler),
    color: '#10b981',
  }];

  const tecDataset = [{
    label: 'Avg VTEC',
    data: history.map(h => h.avgVtec),
    color: '#a855f7',
    fill: true,
  }];

  const delayDataset = [{
    label: 'Avg L1 Delay',
    data: history.map(h => h.avgDelayL1),
    color: '#f59e0b',
    fill: true,
  }];

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Activity style={{ color: 'var(--accent)' }} size={24} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Live Telemetry (Rolling {history.length} samples)</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 10px', borderRadius: '4px' }}>
          Updates every 1.5s
        </span>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            Dilution of Precision (Live)
          </h4>
          <CustomLineChart labels={labels} datasets={dopDatasets} />
        </div>

        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4' }}></span>
            Average SNR (Live)
          </h4>
          <CustomLineChart labels={labels} datasets={snrDataset} fillArea={true} valueSuffix=" dB-Hz" />
        </div>

        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Average Doppler L1 (Live)
          </h4>
          <CustomLineChart labels={labels} datasets={dopplerDataset} valueSuffix=" Hz" />
        </div>

        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }}></span>
            Ionospheric TEC (Live)
          </h4>
          <CustomLineChart labels={labels} datasets={tecDataset} fillArea={true} valueSuffix=" TECU" />
        </div>

        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
            Ionospheric L1 Range Delay (Live)
          </h4>
          <CustomLineChart labels={labels} datasets={delayDataset} fillArea={true} valueSuffix=" m" />
        </div>
      </div>
    </div>
  );
}
