import React, { useState, useEffect, useMemo } from 'react';
import { fetchSatellitePasses } from '../../global_utils/api';
import { getConstellationColor } from './ColorHelper';
import { ArrowUpDown, Filter, Clock, Navigation } from 'lucide-react';
import '../../dashboard/Stylesheet/global.css';
export default function UpcomingPassesTable({
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'elevation'
  const [sortOrder, setSortOrder] = useState('asc');
  const [localSysFilter, setLocalSysFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSatellitePasses(33.6560, 73.1560, 540.0, mask, systemFilter, timeStr);
        if (isMounted) setPasses(data.passes || []);
      } catch (err) {
        console.error('Failed to fetch upcoming satellite passes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [mask, systemFilter, timeStr]);

  const sortedPasses = useMemo(() => {
    let list = passes.filter(p => {
      if (localSysFilter !== 'ALL' && p.constellation !== localSysFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'time') {
        return sortOrder === 'asc'
          ? a.aos_iso.localeCompare(b.aos_iso)
          : b.aos_iso.localeCompare(a.aos_iso);
      } else {
        return sortOrder === 'asc' ? a.max_el - b.max_el : b.max_el - a.max_el;
      }
    });

    return list;
  }, [passes, localSysFilter, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="panel-box full-width-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Panel D: Next Satellite Passes @ NCGSA/IST Reference Point</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={localSysFilter}
            onChange={(e) => setLocalSysFilter(e.target.value)}
            className="globe-select"
            style={{ fontSize: '0.7rem' }}
          >
            <option value="ALL">Filter: All Systems</option>
            <option value="GPS">GPS</option>
            <option value="Galileo">Galileo</option>
            <option value="BeiDou">BeiDou</option>
            <option value="GLONASS">GLONASS</option>
            <option value="IRNSS">NavIC</option>
          </select>
          <span className="badge-cyan">{sortedPasses.length} Passes Scheduled</span>
        </div>
      </div>

      <div className="panel-box-body" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <table className="passes-table">
          <thead>
            <tr>
              <th>System</th>
              <th>PRN</th>
              <th className="sortable-col" onClick={() => toggleSort('time')}>
                AOS <ArrowUpDown size={11} />
              </th>
              <th className="sortable-col" onClick={() => toggleSort('elevation')}>
                Max Elev <ArrowUpDown size={11} />
              </th>
              <th>Max Elev Time</th>
              <th>LOS</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading && passes.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Calculating next satellite pass predictions...
                </td>
              </tr>
            )}

            {sortedPasses.map((pass, idx) => {
              const color = getConstellationColor(pass.constellation === 'IRNSS' ? 'NavIC' : pass.constellation);

              return (
                <tr key={`pass-row-${idx}`}>
                  <td>
                    <span style={{ color, fontWeight: 'bold' }}>{pass.constellation}</span>
                  </td>
                  <td style={{ color: '#ffffff', fontWeight: 'bold' }}>{pass.prn}</td>
                  <td style={{ color: '#06b6d4' }}>{pass.aos}</td>
                  <td>
                    <span className="elev-pill" style={{ backgroundColor: `${color}20`, color }}>
                      {pass.max_el}°
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8' }}>{pass.max_el_time}</td>
                  <td style={{ color: '#f59e0b' }}>{pass.los}</td>
                  <td>{pass.duration_mins} min</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
