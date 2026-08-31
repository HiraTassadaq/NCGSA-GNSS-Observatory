import { useEffect, useMemo, useRef, useState } from 'react';
import Badge from '../common/Badge';
import { getConstellationColor } from '../constants/constellations';
import { toneForBackendQuality } from '../constants/thresholds';
import { formatLocalTime } from '../ictp_lib/format';
import {
  DOME_CARDINALS,
  DOME_CENTER,
  DOME_ELEVATION_RINGS,
  DOME_MERIDIANS,
  DOME_RADIUS,
  DOME_VIEW,
  DEFAULT_PITCH,
  DEFAULT_YAW,
  PITCH_MAX,
  PITCH_MIN,
  domeProject,
  sphereProject,
  meridianPath,
  ringPath,
} from './skyplot3DUtils';

const DRAG_SENSITIVITY_YAW = 0.35;
const DRAG_SENSITIVITY_PITCH = 0.25;
const CLICK_MOVE_THRESHOLD = 4; // px of drag before we treat it as a rotate, not a click

function ToolChip({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-6 px-2 rounded-md text-[10px] font-medium border transition-colors ${
        active ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-white/5 border-border text-text-muted'
      }`}
    >
      {children}
    </button>
  );
}

export default function Skyplot3D({ satellites, selectedPrn, onSelect, hoverPrn, onHover, showTrails }) {
  const [yaw, setYaw] = useState(DEFAULT_YAW);
  const [pitch, setPitch] = useState(DEFAULT_PITCH);
  const [autoRotate, setAutoRotate] = useState(false);
  const dragState = useRef(null); // { startX, startY, startYaw, startPitch, moved }
  const rafRef = useRef(null);
  const svgRef = useRef(null);

  // Slow idle spin, only while not being dragged; cancels cleanly on unmount/toggle.
  useEffect(() => {
    if (!autoRotate) return undefined;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      if (!dragState.current) {
        setYaw((y) => (y + dt * 0.012) % 360);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [autoRotate]);

  const resetView = () => {
    setYaw(DEFAULT_YAW);
    setPitch(DEFAULT_PITCH);
  };

  const onPointerDown = (e) => {
    dragState.current = { startX: e.clientX, startY: e.clientY, startYaw: yaw, startPitch: pitch, moved: false };
    svgRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const drag = dragState.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > CLICK_MOVE_THRESHOLD || Math.abs(dy) > CLICK_MOVE_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;
    setYaw((drag.startYaw + dx * DRAG_SENSITIVITY_YAW + 360) % 360);
    setPitch(Math.max(PITCH_MIN, Math.min(PITCH_MAX, drag.startPitch - dy * DRAG_SENSITIVITY_PITCH)));
  };

  const endDrag = () => {
    dragState.current = null;
  };

  // Project everything once per render of yaw/pitch/satellite change.
  const projected = useMemo(() => {
    return satellites
      .map((sat) => {
        const p = domeProject(sat.azimuth, sat.elevation, yaw, pitch);
        const trailPts = showTrails && sat.trail?.length > 1
          ? sat.trail
              .filter((pt) => pt.elevation != null && pt.azimuth != null)
              .map((pt) => domeProject(pt.azimuth, pt.elevation, yaw, pitch))
          : null;
        return { ...sat, screen: p, trailPts };
      })
      .sort((a, b) => a.screen.depth - b.screen.depth); // far to near, painter's algorithm
  }, [satellites, yaw, pitch, showTrails]);

  const wireframe = useMemo(
    () => ({
      equator: ringPath(0, yaw, pitch),
      rings: DOME_ELEVATION_RINGS.filter((r) => r !== 0).map((r) => ({ r, d: ringPath(r, yaw, pitch) })),
      meridians: DOME_MERIDIANS.map((az) => ({ az, d: meridianPath(az, yaw, pitch) })),
      zenith: sphereProject(0, 90, yaw, pitch),
      nadir: sphereProject(0, -90, yaw, pitch),
      station: domeProject(0, 0, yaw, pitch, 0),
      cardinals: DOME_CARDINALS.map((c) => ({ ...c, p: domeProject(c.az, 4, yaw, pitch) })),
    }),
    [yaw, pitch],
  );

  const hovered = projected.find((s) => s.prn === hoverPrn);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-muted">Drag to rotate</span>
        <span className="flex-1" />
        <ToolChip active={autoRotate} onClick={() => setAutoRotate((v) => !v)} title="Slowly spin the dome">
          Auto-rotate
        </ToolChip>
        <ToolChip onClick={resetView} title="Return to the default viewing angle">
          Reset view
        </ToolChip>
      </div>

      <div className="relative flex-1 min-h-[480px] flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${DOME_VIEW} ${DOME_VIEW}`}
          className="w-full max-w-[720px] aspect-square touch-none select-none"
          style={{ cursor: dragState.current ? 'grabbing' : 'grab', transform: 'scale(1.3)' }}
         
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          <defs>
            <radialGradient id="sphereFill" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.09" />
              <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="domeShell" cx="35%" cy="25%" r="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* full sphere shell -- under orthographic rotation a sphere's silhouette is always
              this exact circle, regardless of yaw/pitch, so no per-frame path recompute needed */}
          <circle cx={DOME_CENTER} cy={DOME_CENTER} r={DOME_RADIUS} fill="url(#sphereFill)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx={DOME_CENTER} cy={DOME_CENTER} r={DOME_RADIUS} fill="url(#domeShell)" opacity="0.7" />

          {/* equator */}
          <path d={wireframe.equator} fill="none" stroke="var(--border)" strokeWidth="1.2" opacity="0.85" />

          {/* latitude rings, both hemispheres */}
          {wireframe.rings.map(({ r, d }) => (
            <path key={r} d={d} fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 3" opacity={r < 0 ? 0.35 : 1} />
          ))}

          {/* meridian ribs, pole to pole */}
          {wireframe.meridians.map(({ az, d }) => (
            <path key={az} d={d} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
          ))}

          {/* polar axis, zenith to nadir */}
          <line
            x1={wireframe.nadir.x}
            y1={wireframe.nadir.y}
            x2={wireframe.zenith.x}
            y2={wireframe.zenith.y}
            stroke="var(--text-muted)"
            strokeWidth="1"
            strokeDasharray="1 3"
            opacity="0.4"
          />

          {/* zenith + nadir markers */}
          <circle cx={wireframe.zenith.x} cy={wireframe.zenith.y} r="2.5" fill="var(--text-muted)" />
          <circle cx={wireframe.nadir.x} cy={wireframe.nadir.y} r="2.5" fill="var(--text-muted)" opacity="0.4" />

          {/* ground station marker, at the sphere's center */}
          <circle cx={wireframe.station.x} cy={wireframe.station.y} r="4" fill="var(--accent)" stroke="var(--panel)" strokeWidth="1.5" />

          {/* cardinal labels */}
          {wireframe.cardinals.map(({ label, p }) => (
            <text
              key={label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="var(--text-primary)"
            >
              {label}
            </text>
          ))}

          {/* trails */}
          {projected.map((sat) => {
            if (!sat.trailPts || sat.trailPts.length < 2) return null;
            const d = sat.trailPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
            return (
              <path
                key={`trail-${sat.prn}`}
                d={d}
                fill="none"
                stroke={getConstellationColor(sat.system)}
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            );
          })}

          {/* satellites, far to near */}
          {projected.map((sat) => {
            const { x, y, depth } = sat.screen;
            const color = getConstellationColor(sat.system);
            const selected = sat.prn === selectedPrn;
            const depthNorm = Math.max(-1, Math.min(1, depth));
            const size = (selected ? 9 : 6.5) * (1 + depthNorm * 0.18);
            const opacity = 0.62 + 0.38 * ((depthNorm + 1) / 2);
            return (
              <g
                key={sat.prn}
                onPointerEnter={() => onHover(sat.prn)}
                onPointerLeave={() => onHover((p) => (p === sat.prn ? null : p))}
                onClick={() => {
                  if (dragState.current?.moved) return;
                  onSelect(selected ? null : sat.prn);
                }}
                style={{ cursor: 'pointer', opacity }}
              >
                <circle cx={x} cy={y} r={size} fill={color} stroke={selected ? '#fff' : 'rgba(7,11,20,0.8)'} strokeWidth={selected ? 2.5 : 1.5} />
                <text x={x + size + 3} y={y + 3} fontSize={selected ? '11' : '9'} fontFamily="'JetBrains Mono', monospace" fill="var(--text-primary)">
                  {sat.prn}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div className="absolute bottom-2 left-2 bg-panel-raised border border-border rounded-md px-2.5 py-2 text-[11px] leading-tight shadow-panel pointer-events-none">
            <p className="font-mono font-semibold text-text-primary">{hovered.prn} <span className="text-text-muted font-sans font-normal">({hovered.system})</span></p>
            <p className="text-text-muted">Elev {hovered.elevation.toFixed(1)}&deg; &middot; Az {hovered.azimuth.toFixed(1)}&deg;</p>
            <p className="text-text-muted">{formatLocalTime(hovered.time)}</p>
            {hovered.quality && <Badge tone={toneForBackendQuality(hovered.quality)} className="mt-1">{hovered.quality}</Badge>}
          </div>
        )}
      </div>
    </div>
  );
}
