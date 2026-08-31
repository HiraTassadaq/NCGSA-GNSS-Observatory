import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { fetchWorldDop } from '../../global_utils/api';
import '../../dashboard/Stylesheet/global.css';
const DOP_FIELDS = [
  { key: 'gdop', label: 'GDOP' },
  { key: 'pdop', label: 'PDOP' },
  { key: 'hdop', label: 'HDOP' },
  { key: 'vdop', label: 'VDOP' },
  { key: 'tdop', label: 'TDOP' }
];

function dopColor(value) {
  const v = Math.min(Math.max(value, 0), 12);
  if (v <= 2) return '#22c55e';
  if (v <= 4) return '#84cc16';
  if (v <= 6) return '#eab308';
  if (v <= 9) return '#f97316';
  return '#ef4444';
}

const MIN_ALTITUDE = 0.4;
const MAX_ALTITUDE = 4.5;

export default function WorldDopGlobe({ height = 520, compact = false }) {
  const globeRef = useRef();
  const containerRef = useRef();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 320 });
  const [data, setData] = useState(null);
  const [dopField, setDopField] = useState('gdop');
  const [stepDeg, setStepDeg] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rotating, setRotating] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.clientWidth || 0, height: el.clientHeight || 320 });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const load = async (step = stepDeg) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchWorldDop(step, 10.0);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load world DOP grid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(stepDeg);
    const timer = setInterval(() => load(stepDeg), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepDeg]);

  // Set the initial camera position once, on mount.
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 40, altitude: 2.4 });
    }
  }, []);

  // Keep the controls' autoRotate flag in sync with the `rotating` toggle,
  // independent of the one-time camera setup above.
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = rotating;
      controls.autoRotateSpeed = 0.4;
    }
  }, [rotating]);

  const points = useMemo(() => {
    if (!data) return [];
    return data.points.map(p => ({
      lat: p.lat,
      lng: p.lng,
      gdop: p.gdop, pdop: p.pdop, hdop: p.hdop, vdop: p.vdop, tdop: p.tdop,
      value: p[dopField],
      numSats: p.num_satellites,
      color: dopColor(p[dopField])
    }));
  }, [data, dopField]);

  const toggleRotation = () => setRotating(prev => !prev);

  const zoomBy = (factor) => {
    const globe = globeRef.current;
    if (!globe) return;
    const pov = globe.pointOfView();
    const newAltitude = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, pov.altitude * factor));
    globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: newAltitude }, 300);
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Anchor the tooltip toward whichever quadrant has room, so it's never
  // clipped by the panel edge.
  const tooltipStyle = useMemo(() => {
    const { width, height: h } = containerSize;
    const OFFSET = 16;
    const style = {};
    if (mousePos.x < width / 2) style.left = mousePos.x + OFFSET;
    else style.right = width - mousePos.x + OFFSET;
    if (mousePos.y < h / 2) style.top = mousePos.y + OFFSET;
    else style.bottom = h - mousePos.y + OFFSET;
    return style;
  }, [mousePos, containerSize]);

  return (
    <div className="panel-box">
      <div className="panel-box-header">
        <span className="panel-box-title">Global DOP Plot</span>
        <div className="globe-controls">
          {DOP_FIELDS.map(f => (
            <button
              key={f.key}
              onClick={() => setDopField(f.key)}
              className={`header-nav-item ${dopField === f.key ? 'active' : ''}`}
              style={{ fontSize: '0.68rem', padding: '2px 8px' }}
            >
              {f.label}
            </button>
          ))}
          <select
            value={stepDeg}
            onChange={(e) => setStepDeg(parseFloat(e.target.value))}
            className="globe-select"
          >
            <option value={10}>10°</option>
            <option value={5}>5°</option>
          </select>
        </div>
      </div>

      {error && <div className="panel-error">{error}</div>}
      {loading && !data && <div className="panel-loading">Computing world DOP grid...</div>}

      <div
        className="panel-box-body"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{ cursor: 'pointer' }}
      >
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.01}
          pointRadius={0.35}
          onGlobeClick={toggleRotation}
          onPointClick={toggleRotation}
          onPointHover={setHoveredPoint}
          width={containerSize.width}
          height={compact ? containerSize.height : height}
        />

        {hoveredPoint && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              ...tooltipStyle,
              zIndex: 100,
              padding: '10px 14px',
              fontSize: '0.78rem',
              width: '180px',
              pointerEvents: 'none',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.7rem' }}>
              {hoveredPoint.lat.toFixed(1)}°, {hoveredPoint.lng.toFixed(1)}°
            </div>
            {DOP_FIELDS.map(f => (
              <div
                key={f.key}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontWeight: f.key === dopField ? 'bold' : 'normal',
                  color: f.key === dopField ? dopColor(hoveredPoint[f.key]) : '#fff'
                }}
              >
                <span>{f.label}:</span>
                <span>{hoveredPoint[f.key].toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: 'var(--text-secondary)' }}>
              <span>Sats visible:</span>
              <span>{hoveredPoint.numSats}</span>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute', bottom: '10px', right: '10px',
            display: 'flex', flexDirection: 'column', gap: '4px',
            zIndex: 50
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); zoomBy(0.75); }}
            aria-label="Zoom in"
            className="globe-zoom-btn"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); zoomBy(1.35); }}
            aria-label="Zoom out"
            className="globe-zoom-btn"
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      <div className="globe-legend">
        <span><span style={{ color: '#22c55e' }}>●</span> &le;2</span>
        <span><span style={{ color: '#84cc16' }}>●</span> 2–4</span>
        <span><span style={{ color: '#eab308' }}>●</span> 4–6</span>
        <span><span style={{ color: '#f97316' }}>●</span> 6–9</span>
        <span><span style={{ color: '#ef4444' }}>●</span> &gt;9</span>
      </div>
    </div>
  );
}
