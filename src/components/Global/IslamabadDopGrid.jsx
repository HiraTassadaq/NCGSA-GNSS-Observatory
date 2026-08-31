import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import { fetchIslamabadGrid } from '../../global_utils/api';
import { generateFullSatCatalog, propagateKeplerian, calculateAzEl, computeDopClient } from '../../global_utils/orbitalEngine';
import 'leaflet/dist/leaflet.css';
import '../../dashboard/Stylesheet/global.css';
const starIcon = L.divIcon({
  className: 'ncgsa-star-icon',
  html: '<div style="font-size: 24px; color: #f59e0b; text-shadow: 0 0 10px #f59e0b;">★</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

function dopColor(val) {
  if (val <= 1.8) return '#22c55e';
  if (val <= 3.0) return '#84cc16';
  if (val <= 4.5) return '#eab308';
  if (val <= 7.0) return '#f97316';
  return '#ef4444';
}

const DOP_FIELDS = ['GDOP', 'PDOP', 'HDOP', 'VDOP', 'TDOP'];

export default function IslamabadDopGrid({
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  const [gridPoints, setGridPoints] = useState([]);
  const [dopType, setDopType] = useState('PDOP');
  const fullCatalog = useMemo(() => generateFullSatCatalog(), []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetchIslamabadGrid(mask, systemFilter, timeStr);
        if (isMounted && res?.points?.length > 0) {
          setGridPoints(res.points);
          return;
        }
      } catch (err) {
        // Fallback
      }

      if (!isMounted) return;
      const baseDate = timeStr ? new Date(timeStr) : new Date();
      const satList = fullCatalog.filter(s => systemFilter === 'ALL' || s.constellation === systemFilter);
      const propagatedSats = satList.map(s => propagateKeplerian(s, baseDate));

      const points = [];
      for (let lat = 33.40; lat <= 33.95; lat += 0.05) {
        for (let lng = 72.80; lng <= 73.35; lng += 0.05) {
          const visibleEnus = [];
          propagatedSats.forEach(satEcef => {
            const azel = calculateAzEl(lat, lng, 540, satEcef);
            if (azel.elevation >= mask) visibleEnus.push(azel);
          });

          const dop = computeDopClient(visibleEnus);
          points.push({
            lat: round(lat, 2),
            lng: round(lng, 2),
            num_satellites: visibleEnus.length,
            gdop: dop.gdop,
            pdop: dop.pdop,
            hdop: dop.hdop,
            vdop: dop.vdop,
            tdop: dop.tdop
          });
        }
      }

      setGridPoints(points);
    })();

    return () => { isMounted = false; };
  }, [mask, systemFilter, timeStr, fullCatalog]);

  const activeKey = dopType.toLowerCase();

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title"> Islamabad DOP Grid (0.25°)</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {DOP_FIELDS.map(f => (
            <button
              key={f}
              className={`header-nav-item ${dopType === f ? 'active' : ''}`}
              style={{ fontSize: '0.65rem', padding: '2px 6px' }}
              onClick={() => setDopType(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-box-body" style={{ flex: 1, minHeight: 0 }}>
        <MapContainer center={[33.6844, 73.0479]} zoom={10} minZoom={9} maxZoom={14} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {gridPoints.map((pt, idx) => {
            const val = pt[activeKey] || 1.35;
            const color = dopColor(val);
            const bounds = [
              [pt.lat - 0.025, pt.lng - 0.025],
              [pt.lat + 0.025, pt.lng + 0.025]
            ];

            return (
              <Rectangle
                key={`isb-dop-${idx}`}
                bounds={bounds}
                pathOptions={{
                  color: color,
                  weight: 0.6,
                  fillColor: color,
                  fillOpacity: 0.5
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                    <strong>Islamabad Grid Cell:</strong> {pt.lat}° N, {pt.lng}° E<br />
                    <strong>{dopType}:</strong> {val.toFixed(2)}<br />
                    <strong>Visible Satellites:</strong> {pt.num_satellites}
                  </div>
                </Popup>
              </Rectangle>
            );
          })}

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
        <span><span style={{ color: '#22c55e' }}>■</span> &le;1.8</span>
        <span><span style={{ color: '#84cc16' }}>■</span> 1.8–3.0</span>
        <span><span style={{ color: '#eab308' }}>■</span> 3.0–4.5</span>
        <span><span style={{ color: '#ef4444' }}>■</span> &gt;4.5</span>
        <span style={{ marginLeft: 'auto', color: '#f59e0b' }}>★ NCGSA/IST</span>
      </div>
    </div>
  );
}

function round(val, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
