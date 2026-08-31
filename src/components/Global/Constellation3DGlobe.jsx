import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { ZoomIn, ZoomOut, RotateCw, Play, Pause, Zap } from 'lucide-react';
import { getConstellationColor } from './ColorHelper';
import { generateFullSatCatalog, propagateKeplerian } from '../../global_utils/orbitalEngine';
import '../../dashboard/Stylesheet/global.css';
const MIN_ALTITUDE = 0.4;
const MAX_ALTITUDE = 5.0;

export default function Constellation3DGlobe({
  satellites = [],
  selectedSatellite = null,
  onSelectSatellite = () => {},
  systemFilter = 'ALL',
  height = 360
}) {
  const globeRef = useRef();
  const containerRef = useRef();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 360 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [isSimulating, setIsSimulating] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(400); // Fast orbital speed
  const [hoveredSat, setHoveredSat] = useState(null);

  // Time state for 60fps fast orbital motion
  const [simTime, setSimTime] = useState(new Date());

  // Generate full satellite catalog (GPS, Galileo, BeiDou, GLONASS, NavIC, QZSS, SBAS)
  const fullCatalog = useMemo(() => generateFullSatCatalog(), []);

  // Fast orbital animation loop (satellites visibly orbit around the Earth)
  useEffect(() => {
    let animId = null;
    let lastTime = performance.now();

    const loop = (now) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      if (isSimulating) {
        // Fast time advancement so satellites complete full orbits in seconds
        setSimTime(prev => new Date(prev.getTime() + deltaMs * speedMultiplier));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, speedMultiplier]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.clientWidth || 0, height: el.clientHeight || 360 });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 70, altitude: 2.5 });
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.4;
      }
    }
  }, [autoRotate]);

  // Floating 3D circle spheres moving in their orbits
  const satLayerData = useMemo(() => {
    return fullCatalog
      .filter(s => systemFilter === 'ALL' || s.constellation === systemFilter)
      .map(s => {
        const prop = propagateKeplerian(s, simTime);
        const color = getConstellationColor(s.constellation);
        const isSelected = selectedSatellite && selectedSatellite.prn === s.prn;

        const normAlt = Math.min(0.55, Math.max(0.22, s.altKm / 50000.0));

        return {
          id: s.prn,
          lat: prop.sat_lat,
          lng: prop.sat_lng,
          altitude: normAlt,
          radius: isSelected ? 4.5 : 2.6,
          color: isSelected ? '#ffffff' : color,
          satData: {
            ...s,
            sat_lat: prop.sat_lat,
            sat_lng: prop.sat_lng,
            sat_alt_km: prop.sat_alt_km
          }
        };
      });
  }, [fullCatalog, systemFilter, simTime, selectedSatellite]);

  // Complete 3D Orbit rings for all satellite planes
  const orbitPaths = useMemo(() => {
    const rings = [];
    const stepDeg = 6;

    fullCatalog
      .filter(s => systemFilter === 'ALL' || s.constellation === systemFilter)
      .forEach(s => {
        const path = [];
        const incRad = (s.incDeg * Math.PI) / 180.0;
        const normAlt = Math.min(0.55, Math.max(0.22, s.altKm / 50000.0));

        for (let a = 0; a <= 360; a += stepDeg) {
          const rad = (a * Math.PI) / 180.0;
          const lat = Math.asin(Math.sin(incRad) * Math.sin(rad)) * (180.0 / Math.PI);
          const lng = ((a + s.raanDeg) % 360) - 180;
          path.push({ lat, lng, alt: normAlt });
        }
        rings.push({ path, color: getConstellationColor(s.constellation) });
      });

    return rings;
  }, [fullCatalog, systemFilter]);

  const zoomBy = (factor) => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    const newAltitude = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, pov.altitude * factor));
    globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: newAltitude }, 300);
  };

  return (
    <div className="panel-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-box-header">
        <span className="panel-box-title">Global 3D constellations</span>
        <div className="header-badge-row">
          <select
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(parseInt(e.target.value))}
            className="globe-select"
            style={{ fontSize: '0.68rem', padding: '2px 6px' }}
          >
            <option value={200}>Fast (200x)</option>
            <option value={400}>Rapid (400x)</option>
            <option value={800}>Hyper (800x)</option>
          </select>

          <button
            className={`btn-icon ${isSimulating ? 'active' : ''}`}
            onClick={() => setIsSimulating(!isSimulating)}
            title="Toggle Fast Orbital Motion"
          >
            {isSimulating ? <Pause size={12} /> : <Play size={12} />}
          </button>

          <button
            className={`btn-icon ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Earth Rotation"
          >
            <RotateCw size={12} />
          </button>
        </div>
      </div>

      <div className="panel-box-body" ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere={true}
          atmosphereColor="#38bdf8"
          atmosphereAltitude={0.15}
          backgroundColor="rgba(0,0,0,0)"

          /* Floating 3D circles (NO vertical ground bars) */
          customLayerData={satLayerData}
          customThreeObject={(d) => {
            const geometry = new THREE.SphereGeometry(d.radius, 16, 16);
            const material = new THREE.MeshBasicMaterial({
              color: d.color,
              toneMapped: false
            });
            return new THREE.Mesh(geometry, material);
          }}
          customThreeObjectUpdate={(obj, d) => {
            if (globeRef.current && globeRef.current.getCoords) {
              const coords = globeRef.current.getCoords(d.lat, d.lng, d.altitude);
              obj.position.set(coords.x, coords.y, coords.z);
            }
          }}
          onCustomLayerClick={(d) => d && onSelectSatellite(d.satData)}
          onCustomLayerHover={(d) => setHoveredSat(d ? d.satData : null)}

          /* Full 3D Orbit Ring Paths */
          pathsData={orbitPaths}
          pathPoints="path"
          pathPointLat="lat"
          pathPointLng="lng"
          pathPointAlt="alt"
          pathColor={(d) => `${d.color}40`}
          pathStroke={1.3}

          width={containerSize.width}
          height={containerSize.height}
        />

        {/* Hover Details */}
        {hoveredSat && (
          <div className="globe-sat-hover-card">
            <strong style={{ color: getConstellationColor(hoveredSat.constellation) }}>
              {hoveredSat.prn} ({hoveredSat.constellation})
            </strong>
            <div>Orbit Sub-Point: {hoveredSat.sat_lat}° N, {hoveredSat.sat_lng}° E</div>
            <div>Altitude: {hoveredSat.sat_alt_km?.toLocaleString()} km</div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="globe-zoom-controls">
          <button onClick={() => zoomBy(0.75)} aria-label="Zoom in" className="globe-zoom-btn">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => zoomBy(1.35)} aria-label="Zoom out" className="globe-zoom-btn">
            <ZoomOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
