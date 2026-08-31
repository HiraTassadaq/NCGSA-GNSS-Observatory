import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Popup } from 'react-leaflet';
import { fetchIslamabadGrid } from '../../global_utils/api';
import { getTecColor } from './TecColorScale';
import { estimateVtecClient } from '../../global_utils/orbitalEngine';
import 'leaflet/dist/leaflet.css';
import '../../dashboard/Stylesheet/global.css';
export default function IslamabadTecMap({
  mask = 10.0,
  timeStr = ''
}) {
  const [gridPoints, setGridPoints] = useState([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetchIslamabadGrid(mask, 'ALL', timeStr);
        if (isMounted && res?.points?.length > 0) {
          setGridPoints(res.points);
          return;
        }
      } catch (err) {
        // Fallback
      }

      if (!isMounted) return;
      const baseDate = timeStr ? new Date(timeStr) : new Date();

      const points = [];
      for (let lat = 33.40; lat <= 33.95; lat += 0.05) {
        for (let lng = 72.80; lng <= 73.35; lng += 0.05) {
          const vtec = estimateVtecClient(lat, lng, baseDate);
          points.push({
            lat: round(lat, 2),
            lng: round(lng, 2),
            vtec
          });
        }
      }

      setGridPoints(points);
    })();

    return () => { isMounted = false; };
  }, [mask, timeStr]);

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title"> Islamabad TEC</span>
        <span className="badge-cyan">Capital Territory Zoom</span>
      </div>

      <div className="panel-box-body" style={{ flex: 1, minHeight: 0 }}>
        <MapContainer center={[33.6844, 73.0479]} zoom={10} minZoom={9} maxZoom={14} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {gridPoints.map((pt, idx) => {
            const tec = pt.vtec || 18;
            const color = getTecColor(tec);
            const bounds = [
              [pt.lat - 0.025, pt.lng - 0.025],
              [pt.lat + 0.025, pt.lng + 0.025]
            ];

            return (
              <Rectangle
                key={`isb-tec-${idx}`}
                bounds={bounds}
                pathOptions={{
                  color: color,
                  weight: 0.5,
                  fillColor: color,
                  fillOpacity: 0.5
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                    <strong>Islamabad Territory TEC:</strong><br />
                    Lat: {pt.lat}° N, Lng: {pt.lng}° E<br />
                    <strong>VTEC:</strong> {tec.toFixed(1)} TECU
                  </div>
                </Popup>
              </Rectangle>
            );
          })}
        </MapContainer>
      </div>

      <div className="globe-legend">
        <span><span style={{ color: '#3b82f6' }}>■</span> &lt;12 TECU</span>
        <span><span style={{ color: '#06b6d4' }}>■</span> 12–25</span>
        <span><span style={{ color: '#eab308' }}>■</span> 25–40</span>
        <span><span style={{ color: '#ef4444' }}>■</span> &gt;40 TECU</span>
      </div>
    </div>
  );
}

function round(val, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
