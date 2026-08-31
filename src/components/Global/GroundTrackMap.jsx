import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { createSatelliteIcon } from './OrbitMapHelper';
import { getConstellationColor } from './ColorHelper';
import { generateFullSatCatalog, propagateKeplerian } from '../../global_utils/orbitalEngine';
import 'leaflet/dist/leaflet.css';

export default function GroundTrackMap({
  systemFilter = 'ALL',
  selectedSatellite = null,
  timeStr = '',
  height = 360
}) {
  const [satFilter, setSatFilter] = useState('ALL');
  const [liveDate, setLiveDate] = useState(new Date());

  const fullCatalog = useMemo(() => generateFullSatCatalog(), []);

  // Update live satellite position along the complete ground track
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute COMPLETE full-orbit ground tracks (0° to 360° / full period start-to-finish)
  const tracksData = useMemo(() => {
    const baseDate = timeStr ? new Date(timeStr) : liveDate;
    const result = [];

    const list = fullCatalog.filter(s => systemFilter === 'ALL' || s.constellation === systemFilter);

    // Limit to top 30 satellites for smooth 60fps rendering
    list.slice(0, 30).forEach(s => {
      const currentProp = propagateKeplerian(s, baseDate);

      // Full orbit cycle: -6h to +6h (full revolution from start to finish)
      const rawPoints = [];
      const halfPeriodMins = (s.periodMins || 720) / 2.0;

      for (let m = -halfPeriodMins; m <= halfPeriodMins; m += 4) {
        const t = new Date(baseDate.getTime() + m * 60 * 1000);
        const p = propagateKeplerian(s, t);
        rawPoints.push({ lat: p.sat_lat, lng: p.sat_lng });
      }

      // Split polylines across the -180° / +180° antimeridian so lines don't cross the world horizontally
      const segments = splitAntimeridian(rawPoints);

      result.push({
        prn: s.prn,
        constellation: s.constellation,
        current: {
          lat: currentProp.sat_lat,
          lng: currentProp.sat_lng,
          alt_km: currentProp.sat_alt_km,
          pos: [currentProp.sat_lat, currentProp.sat_lng]
        },
        segments: segments
      });
    });

    return result;
  }, [fullCatalog, systemFilter, timeStr, liveDate]);

  const filteredTracks = tracksData.filter(t => {
    if (satFilter !== 'ALL' && t.prn !== satFilter) return false;
    return true;
  });

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Global 2D Constellations Ground Track</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={satFilter}
            onChange={(e) => setSatFilter(e.target.value)}
            className="globe-select"
            style={{ fontSize: '0.7rem' }}
          >
            <option value="ALL">All Satellites</option>
            {tracksData.map(t => (
              <option key={t.prn} value={t.prn}>{t.prn} ({t.constellation})</option>
            ))}
          </select>
          <span className="badge-cyan">{filteredTracks.length} Full Orbits</span>
        </div>
      </div>

      <div className="panel-box-body" style={{ flex: 1, minHeight: 0 }}>
        <MapContainer center={[20, 0]} zoom={2} minZoom={1.5} maxZoom={7} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {filteredTracks.map((tr, idx) => {
            const color = getConstellationColor(tr.constellation);

            return (
              <React.Fragment key={`gt-full-${idx}`}>
                {/* Complete Full Orbit Path Segments (Start to Finish) */}
                {tr.segments.map((seg, segIdx) => (
                  <Polyline
                    key={`seg-${idx}-${segIdx}`}
                    positions={seg}
                    color={color}
                    weight={2}
                    opacity={0.8}
                    dashArray="5, 5"
                  />
                ))}

                {/* Live Satellite Position Dot / Marker Moving Along Complete Ground Track */}
                <Marker position={tr.current.pos} icon={createSatelliteIcon(tr.constellation, true, 'active')}>
                  <Popup>
                    <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
                      <strong style={{ color: '#0284c7' }}>{tr.prn} ({tr.constellation})</strong><br />
                      <strong>Live Satellite Position:</strong><br />
                      Lat: {tr.current.lat}° | Lng: {tr.current.lng}°<br />
                      Altitude: {tr.current.alt_km?.toLocaleString()} km
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      <div className="ground-track-legend">
        <span><span className="line-future" /> Complete Orbit Path (Start to Finish)</span>
        <span>● Live Satellite Position</span>
      </div>
    </div>
  );
}

/**
 * Split polyline array into separate continuous segments whenever crossing -180° / +180° longitude.
 */
function splitAntimeridian(points) {
  if (!points || points.length < 2) return [];

  const segments = [];
  let currentSegment = [[points[0].lat, points[0].lng]];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // Check if longitude jump exceeds 180° (antimeridian boundary crossing)
    if (Math.abs(curr.lng - prev.lng) > 180) {
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      currentSegment = [[curr.lat, curr.lng]];
    } else {
      currentSegment.push([curr.lat, curr.lng]);
    }
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}
