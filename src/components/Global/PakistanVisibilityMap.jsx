import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import { fetchPakistanGrid } from '../../global_utils/api';
import { generateFullSatCatalog, propagateKeplerian, calculateAzEl } from '../../global_utils/orbitalEngine';
import 'leaflet/dist/leaflet.css';
import '../../dashboard/Stylesheet/global.css';
const CITIES = [
  { name: 'NCGSA / IST', lat: 33.6560, lng: 73.1560, isStar: true },
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249 },
  { name: 'Quetta', lat: 30.1798, lng: 66.9750 },
  { name: 'Gilgit', lat: 35.9208, lng: 74.3089 },
  { name: 'Multan', lat: 30.1575, lng: 71.5249 }
];

const starIcon = L.divIcon({
  className: 'ncgsa-star-icon',
  html: '<div style="font-size: 22px; color: #f59e0b; text-shadow: 0 0 10px #f59e0b;">★</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const cityIcon = L.divIcon({
  className: 'city-dot-icon',
  html: '<div style="width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; border: 1.5px solid #fff; box-shadow: 0 0 6px #38bdf8;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

function getVisColor(count) {
  if (count >= 24) return '#22c55e';
  if (count >= 18) return '#84cc16';
  if (count >= 12) return '#eab308';
  if (count >= 6) return '#f97316';
  return '#ef4444';
}

export default function PakistanVisibilityMap({
  mask = 10.0,
  systemFilter = 'ALL',
  timeStr = ''
}) {
  const [gridData, setGridData] = useState([]);
  const fullCatalog = useMemo(() => generateFullSatCatalog(), []);

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
        // Fallback to client calculation
      }

      if (!isMounted) return;
      const baseDate = timeStr ? new Date(timeStr) : new Date();
      const satList = fullCatalog.filter(s => systemFilter === 'ALL' || s.constellation === systemFilter);
      const propagatedSats = satList.map(s => propagateKeplerian(s, baseDate));

      const points = [];
      for (let lat = 24.0; lat <= 36.0; lat += 1.0) {
        for (let lng = 61.0; lng <= 76.0; lng += 1.0) {
          let visibleCount = 0;
          propagatedSats.forEach(satEcef => {
            const azel = calculateAzEl(lat, lng, 200, satEcef);
            if (azel.elevation >= mask) visibleCount++;
          });

          points.push({
            lat, lng,
            num_satellites: visibleCount,
            pdop: visibleCount > 4 ? round(18.0 / Math.max(1, visibleCount - 2), 2) : 2.5
          });
        }
      }

      setGridData(points);
    })();

    return () => { isMounted = false; };
  }, [mask, systemFilter, timeStr, fullCatalog]);

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">National 2D constellations</span>
        <span className="badge-cyan">1° Grid Heatmap Overlay</span>
      </div>

      <div className="panel-box-body" style={{ flex: 1, minHeight: 0 }}>
        <MapContainer center={[30.0, 69.5]} zoom={5} minZoom={4} maxZoom={9} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* 1° Grid Cells Heatmap */}
          {gridData.map((pt, idx) => {
            const bounds = [
              [pt.lat - 0.5, pt.lng - 0.5],
              [pt.lat + 0.5, pt.lng + 0.5]
            ];
            const color = getVisColor(pt.num_satellites);

            return (
              <Rectangle
                key={`pk-vis-${idx}`}
                bounds={bounds}
                pathOptions={{
                  color: color,
                  weight: 0.6,
                  fillColor: color,
                  fillOpacity: 0.4
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                    <strong>Grid Point:</strong> {pt.lat}° N, {pt.lng}° E<br />
                    <strong>Satellites In View:</strong> {pt.num_satellites}<br />
                    <strong>PDOP:</strong> {pt.pdop.toFixed(2)}
                  </div>
                </Popup>
              </Rectangle>
            );
          })}

          {/* Major Cities & NCGSA/IST Star */}
          {CITIES.map((c, idx) => (
            <Marker
              key={`city-${idx}`}
              position={[c.lat, c.lng]}
              icon={c.isStar ? starIcon : cityIcon}
            >
              <Popup>
                <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
                  {c.name}<br />
                  <span style={{ fontWeight: 'normal', fontSize: '0.75rem' }}>
                    {c.lat.toFixed(4)}° N, {c.lng.toFixed(4)}° E
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="globe-legend">
        <span><span style={{ color: '#22c55e' }}>■</span> &ge;24 sats</span>
        <span><span style={{ color: '#84cc16' }}>■</span> 18–23</span>
        <span><span style={{ color: '#eab308' }}>■</span> 12–17</span>
        <span><span style={{ color: '#f97316' }}>■</span> 6–11</span>
        <span><span style={{ color: '#ef4444' }}>■</span> &lt;6</span>
        <span style={{ marginLeft: 'auto', color: '#f59e0b' }}>★ NCGSA/IST</span>
      </div>
    </div>
  );
}

function round(val, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
