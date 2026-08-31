import React, { useState, useEffect } from 'react';
import { fetchTimeSeries } from '../../global_utils/api';
import CustomLineChart from './CustomLineChart';
import { getConstellationColor } from './ColorHelper';
import { X } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
const CHART_DEFS = {
  satellites: {
    title: 'Number of Satellites (Last 2h)',
    build: (d) => [{ label: 'Visible Satellites', data: d.num_satellites, color: '#06b6d4', fill: true }],
    suffix: ''
  },
  dop: {
    title: 'Dilution of Precision (DOP)',
    build: (d) => [
      { label: 'GDOP', data: d.dop.map(x => x.gdop), color: '#ef4444' },
      { label: 'PDOP', data: d.dop.map(x => x.pdop), color: '#3b82f6' },
      { label: 'HDOP', data: d.dop.map(x => x.hdop), color: '#10b981' },
      { label: 'VDOP', data: d.dop.map(x => x.vdop), color: '#f59e0b' },
      { label: 'TDOP', data: d.dop.map(x => x.tdop), color: '#8b5cf6' }
    ],
    suffix: ''
  },
  elevation: {
    title: 'Satellite Elevation Angle (deg)',
    build: (d) => Object.keys(d.satellite_paths).map(prn => ({
      label: prn,
      data: d.satellite_paths[prn].elevations,
      color: getConstellationColor(d.satellite_paths[prn].constellation)
    })),
    suffix: '°'
  },
  altitude: {
    title: 'Satellite Orbital Altitude (SGP4)',
    build: (d) => Object.keys(d.satellite_paths).map(prn => ({
      label: prn,
      data: d.satellite_paths[prn].altitudes,
      color: getConstellationColor(d.satellite_paths[prn].constellation)
    })),
    suffix: ' km'
  }
};

export default function AnalysisChartModal({ chartId, observer, onClose }) {
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
          setError(err.message || 'Failed to fetch time-series data.');
          setLoading(false);
        }
      }
    };

    setLoading(true);
    load();
    const intervalId = setInterval(load, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [observer.lat, observer.lng, observer.alt, observer.mask, chartId]);

  const def = CHART_DEFS[chartId] || CHART_DEFS.satellites;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-box-header">
          <h3>{def.title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-box-body">
          {loading && <div className="panel-loading">Loading analysis chart...</div>}
          {!loading && error && <div className="panel-error">{error}</div>}
          {!loading && !error && data && (
            <CustomLineChart labels={data.times} datasets={def.build(data)} fillArea={false} valueSuffix={def.suffix} />
          )}
        </div>
      </div>
    </div>
  );
}
