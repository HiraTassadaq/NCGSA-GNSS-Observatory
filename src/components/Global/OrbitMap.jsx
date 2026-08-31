import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { createObserverIcon, createSatelliteIcon, ChangeMapView } from './OrbitMapHelper';
import 'leaflet/dist/leaflet.css';
import '../../dashboard/Stylesheet/global.css';
export default function OrbitMap({ observer, satellites = [], height = 400 }) {
  const observerCenter = [observer.lat, observer.lng];
  // Only satellites currently available (above the elevation mask) from the
  // observer's position belong on this map — the map is about what's
  // reachable from where you're standing, not the full global constellation.
  const visibleSatellites = satellites.filter(sat => sat.visible !== false);

  const renderBeams = () => {
    return visibleSatellites.map((sat, idx) => {
      const satPos = [sat.sat_lat, sat.sat_lng];
      let color = '#06b6d4';
      if (sat.constellation === 'GLONASS') color = '#10b981';
      else if (sat.constellation === 'Galileo') color = '#3b82f6';
      else if (sat.constellation === 'BeiDou') color = '#f59e0b';
      else if (sat.constellation === 'IRNSS') color = '#8b5cf6';
      else if (sat.constellation === 'QZSS') color = '#ec4899';

      return (
        <Polyline
          key={`beam-${idx}`}
          positions={[observerCenter, satPos]}
          color={color}
          weight={1}
          opacity={0.35}
          dashArray="4, 4"
        />
      );
    });
  };

  return (
    <div className="map-container-wrapper" style={{ height }}>
      <MapContainer center={observerCenter} zoom={2} minZoom={1.5} maxZoom={10} scrollWheelZoom={true}>
        <ChangeMapView center={observerCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Circle
          center={observerCenter}
          radius={2000000}
          pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.05, weight: 1 }}
        />
        <Marker position={observerCenter} icon={createObserverIcon()}>
          <Popup>
            <div style={{ color: '#000', fontFamily: 'var(--font-sans)' }}>
              <strong>Active Observer Location</strong><br />
              Lat: {observer.lat.toFixed(4)}<br />
              Lng: {observer.lng.toFixed(4)}<br />
              Mask: {observer.mask}°
            </div>
          </Popup>
        </Marker>
        {visibleSatellites.map((sat, idx) => (
          <Marker key={`sat-${idx}`} position={[sat.sat_lat, sat.sat_lng]} icon={createSatelliteIcon(sat.constellation, sat.visible, sat.health?.status)}>
            <Popup>
              <div style={{ color: '#000', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}>
                <strong style={{ color: '#0369a1' }}>{sat.prn} ({sat.constellation})</strong><br />
                <strong>Sub-Satellite Point:</strong><br />
                Lat: {sat.sat_lat}° | Lng: {sat.sat_lng}°<br />
                Altitude: {sat.sat_alt_km.toLocaleString()} km<br />
                Az: {sat.azimuth}° | El: {sat.elevation}°<br />
                Doppler L1: {sat.doppler.doppler_l1} Hz<br />
                Health: {sat.health?.status || 'unknown'}
              </div>
            </Popup>
          </Marker>
        ))}
        {renderBeams()}
      </MapContainer>
    </div>
  );
}
