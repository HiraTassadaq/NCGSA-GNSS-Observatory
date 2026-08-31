import React, { useState, useEffect } from 'react';
import { fetchTimeSeries } from '../../utils/api';
import CustomLineChart from './CustomLineChart';
import { getConstellationColor } from './ColorHelper';
import { History } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
// How often the window re-fetches while this tab stays open, so the trailing
// 2-hour view keeps sliding forward on its own (e.g. 10:46-12:46 becomes
// 10:51-12:51 a few minutes later) without needing a manual refresh.
const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export default function TimeSeriesDashboard({ observer }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError('');
        const res = await fetchTimeSeries(observer.lat, observer.lng, observer.alt, observer.mask);
        if (active) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to fetch historical time-series.');
          setLoading(false);
        }
      }
    };

    setLoading(true);
    load();
    const intervalId = setInterval(load, AUTO_REFRESH_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [observer.lat, observer.lng, observer.alt, observer.mask]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ marginTop: '24px', padding: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading the last 2 hours of orbital history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ marginTop: '24px', padding: '20px', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
        <p>Error loading historical charts: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { times, num_satellites, dop, tec, satellite_paths, window_start, window_end } = data;

  const formatWindowTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // 1. Number of Satellites Dataset
  const satDatasets = [{
    label: 'Visible Satellites',
    data: num_satellites,
    color: '#06b6d4',
    fill: true
  }];

  // 2. DOP Dataset
  const dopDatasets = [
    { label: 'GDOP', data: dop.map(d => d.gdop), color: '#ef4444' },
    { label: 'PDOP', data: dop.map(d => d.pdop), color: '#3b82f6' },
    { label: 'HDOP', data: dop.map(d => d.hdop), color: '#10b981' },
    { label: 'VDOP', data: dop.map(d => d.vdop), color: '#f59e0b' },
    { label: 'TDOP', data: dop.map(d => d.tdop), color: '#8b5cf6' }
  ];

  // 3. Elevation Dataset (actual tracked satellite paths over the window)
  const elevDatasets = Object.keys(satellite_paths).map(prn => ({
    label: prn,
    data: satellite_paths[prn].elevations,
    color: getConstellationColor(satellite_paths[prn].constellation)
  }));

  // 4. TEC Dataset
  const tecDatasets = [{
    label: 'Ionospheric TEC',
    data: tec,
    color: '#a855f7',
    fill: true
  }];

  // 5. Altitude Dataset
  const altDatasets = Object.keys(satellite_paths).map(prn => ({
    label: prn,
    data: satellite_paths[prn].altitudes,
    color: getConstellationColor(satellite_paths[prn].constellation)
  }));

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <History style={{ color: 'var(--accent)' }} size={24} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Historical Analysis Charts (Last 2 Hours)</h3>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Actual computed orbital data from {formatWindowTime(window_start)} to {formatWindowTime(window_end)} — not a forecast. This window slides forward automatically every {AUTO_REFRESH_MS / 60000} minutes.
      </p>

      <div className="dashboard-grid">
        {/* Chart 1: Number of Satellites */}
        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4' }}></span>
            Number of Satellites (Last 2h)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Visible satellites over the past 2-hour window</p>
          <CustomLineChart labels={times} datasets={satDatasets} fillArea={true} />
        </div>

        {/* Chart 2: DOP Values */}
        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
            Dilution of Precision (DOP)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Geometry quality indices over the past 2 hours (GDOP, PDOP, HDOP, VDOP)</p>
          <CustomLineChart labels={times} datasets={dopDatasets} />
        </div>

        {/* Chart 3: Elevation Angle */}
        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            Satellite Elevation Angle (deg)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Actual elevation trajectory for tracked satellites over the past 2 hours</p>
          <CustomLineChart labels={times} datasets={elevDatasets} valueSuffix="°" />
        </div>

        {/* Chart 4: Ionospheric TEC */}
        <div className="glass-panel">
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }}></span>
            Ionospheric TEC (VTEC)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Total Electron Content over the past 2 hours</p>
          <CustomLineChart labels={times} datasets={tecDatasets} fillArea={true} valueSuffix=" TECU" />
        </div>

        {/* Chart 5: Altitude */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
            Satellite Orbital Altitude (SGP4)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Actual radial distance (altitude) over the past 2 hours</p>
          <CustomLineChart labels={times} datasets={altDatasets} valueSuffix=" km" />
        </div>
      </div>
    </div>
  );
}
