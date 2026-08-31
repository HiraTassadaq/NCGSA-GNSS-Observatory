import React, { useState, useEffect } from 'react';
import { fetchTimeSeries } from '../../utils/api';
import CustomLineChart from './CustomLineChart';
import '../../dashboard/Stylesheet/global.css';
export default function TecChart({ observer }) {
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
  }, [observer.lat, observer.lng, observer.alt, observer.mask]);

  const tecDatasets = data
    ? [{ label: 'Ionospheric TEC', data: data.tec, color: '#a855f7', fill: true }]
    : [];

  return (
    <div className="panel-box">
      <div className="panel-box-header">
        <span className="panel-box-title">Ionospheric TEC (VTEC) — Last 2h</span>
      </div>
      <div className="panel-box-body">
        {loading && <div className="panel-loading">Loading TEC history...</div>}
        {!loading && error && <div className="panel-error">{error}</div>}
        {!loading && !error && data && (
          <div style={{ width: '100%', height: '100%' }}>
            <CustomLineChart labels={data.times} datasets={tecDatasets} fillArea={true} valueSuffix=" TECU" />
          </div>
        )}
      </div>
    </div>
  );
}
