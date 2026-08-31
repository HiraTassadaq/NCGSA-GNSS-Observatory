import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import { fetchPakistanGrid } from '../../global_utils/api';
import { generateFullSatCatalog, propagateKeplerian, calculateAzEl, computeDopClient } from '../../global_utils/orbitalEngine';
import 'leaflet/dist/leaflet.css';
import '../../dashboard/Stylesheet/global.css';
const starIcon = L.divIcon({
  className: 'ncgsa-star-icon',
  html: '<div style="font-size: 22px; color: #f59e0b; text-shadow: 0 0 10px #f59e0b;">★</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function dopColor(val) {
  if (val <= 2.0) return '#22c55e';
  if (val <= 3.5) return '#84cc16';
  if (val <= 5.0) return '#eab308';
  if (val <= 8.0) return '#f97316';
  return '#ef4444';
}

const DOP_FIELDS = ['GDOP', 'PDOP', 'HDOP', 'VDOP', 'TDOP'];

export default function PakistanDopGrid({
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  const [gridData, setGridData] = useState([]);
  const [dopType, setDopType] = useState('PDOP');
  const fullCatalog = useMemo(() => generateFullSatCatalog(), []);

  // Compute 1° x 1° Pakistan DOP Grid
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetchPakistanGrid(mask, systemFilter, timeStr);
        if (isMounted && res?.points?.length > 0) {
          setGridData(res.points);
          return;
        }
      } catch (err) {
        // Fallback to client orbital calculation
      }

      if (!isMounted) return;
      const baseDate = timeStr ? new Date(timeStr) : new Date();
      const satList = fullCatalog.filter(s => systemFilter === 'ALL' || s.constellation === systemFilter);

      const propagatedSats = satList.map(s => propagateKeplerian(s, baseDate));

      const points = [];
      for (let lat = 24.0; lat <= 36.0; lat += 1.0) {
        for (let lng = 61.0; lng <= 76.0; lng += 1.0) {
          const visibleEnus = [];
          propagatedSats.forEach(satEcef => {
            const azel = calculateAzEl(lat, lng, 200, satEcef);
            if (azel.elevation >= mask) {
              visibleEnus.push(azel);
            }
          });

          const dop = computeDopClient(visibleEnus);
          points.push({
            lat, lng,
            num_satellites: visibleEnus.length,
            gdop: dop.gdop,
            pdop: dop.pdop,
            hdop: dop.hdop,
            vdop: dop.vdop,
            tdop: dop.tdop
          });
        }
      }

      setGridData(points);
    })();

    return () => { isMounted = false; };
  }, [mask, systemFilter, timeStr, fullCatalog]);

  const activeKey = dopType.toLowerCase();

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Pakistan DOP Grid (1° High-Res)</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {DOP_FIELDS.map(field => (
            <button
              key={field}
              className={`header-nav-item ${dopType === field ? 'active' : ''}`}
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
              onClick={() => setDopType(field)}
            >
              {field}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-box-body" style={{ flex: 1, minHeight: 0 }}>
        <MapContainer center={[30.0, 69.5]} zoom={5} minZoom={4} maxZoom={9} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {gridData.map((pt, idx) => {
            const val = pt[activeKey] || 1.5;
            const color = dopColor(val);
            const bounds = [
              [pt.lat - 0.5, pt.lng - 0.5],
              [pt.lat + 0.5, pt.lng + 0.5]
            ];

            return (
              <Rectangle
                key={`pk-dop-${idx}`}
                bounds={bounds}
                pathOptions={{
                  color: color,
                  weight: 0.6,
                  fillColor: color,
                  fillOpacity: 0.45
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                    <strong>Pakistan Grid Point:</strong> {pt.lat}° N, {pt.lng}° E<br />
                    <strong>{dopType}:</strong> {val.toFixed(2)}<br />
                    <strong>Visible Satellites:</strong> {pt.num_satellites}
                  </div>
                </Popup>
              </Rectangle>
            );
          })}

          {/* NCGSA/IST Star */}
          <Marker position={[33.6560, 73.1560]} icon={starIcon}>
            <Popup>
              <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
                NCGSA / IST Reference Point (★)<br />
                <span style={{ fontWeight: 'normal', fontSize: '0.78rem' }}>
                  Lat: 33.6560° N, Lng: 73.1560° E
                </span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="globe-legend">
        <span><span style={{ color: '#22c55e' }}>■</span> &le;2.0 (Excel)</span>
        <span><span style={{ color: '#84cc16' }}>■</span> 2.0–3.5 (Good)</span>
        <span><span style={{ color: '#eab308' }}>■</span> 3.5–5.0 (Fair)</span>
        <span><span style={{ color: '#ef4444' }}>■</span> &gt;5.0 (Poor)</span>
        <span style={{ marginLeft: 'auto', color: '#f59e0b' }}>★ NCGSA/IST</span>
      </div>
    </div>
  );
}
