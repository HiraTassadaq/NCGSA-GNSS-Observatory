import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getConstellationColor, getHealthColor } from './ColorHelper';
import '../../dashboard/Stylesheet/global.css';// Leaflet Default Icon Patch
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const createObserverIcon = () => L.divIcon({
  className: 'custom-obs-icon',
  html: `<div style="background-color: #38bdf8; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px #38bdf8; animation: pulse-green 2s infinite;"></div>`,
  iconSize: [12, 12], iconAnchor: [6, 6]
});

export const createStationIcon = (code) => L.divIcon({
  className: 'custom-station-icon',
  html: `<div style="background-color: #8b5cf6; width: 10px; height: 10px; border-radius: 3px; border: 1.5px solid #fff; box-shadow: 0 0 6px #8b5cf6;" title="IGS Ground Station: ${code}"></div>`,
  iconSize: [10, 10], iconAnchor: [5, 5]
});

// `visible` reflects pure line-of-sight geometry (elevation >= mask) for THIS observer,
// while `healthStatus` reflects the satellite's real operational status (active/standby/
// inactive/unknown) independent of any observer — see backend app/orbits/health.py.
// Size/opacity encode visibility; the outline ring color encodes health, so the two are
// visually distinguishable at a glance rather than conflated.
export const createSatelliteIcon = (constellation, visible = true, healthStatus = 'unknown') => {
  const color = getConstellationColor(constellation);
  const size = visible ? 8 : 6;
  const opacity = visible ? 1.0 : 0.4;
  const shadow = visible ? `box-shadow: 0 0 5px ${color};` : '';

  const ringColor = getHealthColor(healthStatus);
  const border = healthStatus === 'inactive'
    ? `border: 2px solid ${ringColor};`
    : (visible ? 'border: 1px solid #fff;' : 'border: 1px solid rgba(255,255,255,0.4);');

  const title = `${constellation} — Health: ${healthStatus}${visible ? '' : ' (below elevation mask)'}`;

  return L.divIcon({
    className: 'custom-sat-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; ${border} ${shadow} opacity: ${opacity};" title="${title}"></div>`,
    iconSize: [size, size], iconAnchor: [size/2, size/2]
  });
};

export function ChangeMapView({ center }) {
  const map = useMap();
  const lastCenter = useRef(null);

  useEffect(() => {
    // Only re-centre the map when the observer's geographic location actually
    // changes (lat/lng). Using the raw lat/lng values (instead of re-running on
    // every render / zoom change) lets the user pan and zoom freely without the
    // map snapping back to the observer on each telemetry update.
    const key = `${center[0]},${center[1]}`;
    if (lastCenter.current === key) return;
    lastCenter.current = key;
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}
