import { useEffect, useMemo, useRef, useState } from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';
import { LoadingState, EmptyState, ErrorState } from '../common/AsyncStates';
import { CONSTELLATIONS, getConstellationColor, normalizeSystemName } from '../constants/constellations';
import { toneForBackendQuality } from '../constants/thresholds';
import { formatLocalTime } from '../ictp_lib/format';
import { useSelection } from '../ictp_state/SelectionContext';
import { ELEVATION_RINGS, elevationRingRadius, polarToXY, SKYPLOT_CENTER, SKYPLOT_VIEW } from './skyplotUtils';
import Skyplot3D from './Skyplot3D';

function ToggleChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-6 px-2 rounded-md text-[10px] font-medium border transition-colors ${
        active ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-white/5 border-border text-text-muted'
      }`}
    >
      {children}
    </button>
  );
}

export default function Skyplot({ skyplotResponse, satellitesResponse, loading, notFound, error }) {
  const { selectedPrn, setSelectedPrn } = useSelection();
  const [visible, setVisible] = useState(() => new Set(CONSTELLATIONS));
  const [showTrails, setShowTrails] = useState(false);
  const [elevationMask, setElevationMask] = useState(10);
  const [hoverPrn, setHoverPrn] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('3D'); // '2D' | '3D'
  const containerRef = useRef(null);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const qualityByPrn = useMemo(
    () => new Map((satellitesResponse || []).map((s) => [s.prn, s])),
    [satellitesResponse],
  );

  const satellites = useMemo(() => {
    return (skyplotResponse?.satellites || [])
      .map((sat) => {
        const path = sat.path || [];
        const last = path[path.length - 1];
        if (!last || last.elevation_deg == null || last.azimuth_deg == null) return null;
        const info = qualityByPrn.get(sat.prn);
        return {
          prn: sat.prn,
          system: normalizeSystemName(sat.system),
          elevation: last.elevation_deg,
          azimuth: last.azimuth_deg,
          time: last.time,
          quality: info?.quality,
          snr: info?.avg_snr,
          trail: path.map((p) => ({ elevation: p.elevation_deg, azimuth: p.azimuth_deg })),
        };
      })
      .filter(Boolean)
      .filter((s) => visible.has(s.system))
      .filter((s) => s.elevation >= elevationMask);
  }, [skyplotResponse, qualityByPrn, visible, elevationMask]);

  const toggleSystem = (sys) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(sys)) next.delete(sys);
      else next.add(sys);
      return next;
    });
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen?.();
  };

  const hovered = satellites.find((s) => s.prn === hoverPrn);
  const pinned = !hovered ? satellites.find((s) => s.prn === selectedPrn) : null;
  const shown = hovered || pinned;

  return (
    <Panel
      title="Sky Plot"
      subtitle={skyplotResponse ? `${satellites.length} of ${skyplotResponse.satellite_count} satellites shown` : undefined}
      actions={
        <>
          {error && skyplotResponse && (
            <Badge tone="warning" title={error.message}>
              Offline · last known data
            </Badge>
          )}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            {['2D', '3D'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`h-6 px-2 text-[10px] font-semibold transition-colors ${
                  viewMode === mode ? 'bg-accent/15 text-accent' : 'bg-white/5 text-text-muted hover:text-text-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-6 px-2 rounded-md text-[10px] font-medium border border-border bg-white/5 text-text-muted hover:text-text-primary"
          >
            {isFullscreen ? 'Exit FS' : 'Fullscreen'}
          </button>
        </>
      }
      bodyClassName="flex flex-col gap-2"
      className="h-full"
    >
      <div ref={containerRef} className="flex flex-col gap-2 bg-panel h-full">
        <div className="flex flex-wrap items-center gap-1.5">
          {CONSTELLATIONS.map((sys) => (
            <button
              key={sys}
              type="button"
              onClick={() => toggleSystem(sys)}
              className="h-5 px-1.5 rounded text-[9px] font-semibold border transition-opacity"
              style={{
                borderColor: `${getConstellationColor(sys)}55`,
                color: getConstellationColor(sys),
                background: `${getConstellationColor(sys)}1f`,
                opacity: visible.has(sys) ? 1 : 0.35,
              }}
            >
              {sys}
            </button>
          ))}
          <span className="flex-1" />
          <ToggleChip active={showTrails} onClick={() => setShowTrails((v) => !v)}>Trails</ToggleChip>
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            {[0, 5, 10, 15, 20].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setElevationMask(preset)}
                className={`h-5 px-1.5 text-[9px] font-semibold transition-colors ${
                  elevationMask === preset ? 'bg-accent/15 text-accent' : 'bg-white/5 text-text-muted hover:text-text-primary'
                }`}
              >
                {preset}°
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-[10px] text-text-muted">
            Mask
            <input
              type="number"
              value={elevationMask}
              min={-10}
              max={45}
              onChange={(e) => setElevationMask(Number(e.target.value))}
              className="w-10 h-5 bg-white/5 border border-border rounded px-1 text-text-primary text-[10px] tabular-nums"
            />
            °
          </label>
        </div>

        <div className="relative flex-1 min-h-[280px] flex items-center justify-center">
          {loading && !skyplotResponse && <LoadingState />}
          {/* A failed poll (e.g. connection dropped) should never hide a
              skyplot we already successfully loaded -- only show the empty
              / error states when we have nothing on screen yet. */}
          {!skyplotResponse && notFound && (
            <EmptyState
              title="No sky-plot data yet"
              detail="A navigation file may not have arrived yet -- elevation/azimuth requires both an observation and a navigation file."
            />
          )}
          {!skyplotResponse && !notFound && error && <ErrorState detail={error.message} />}

          {skyplotResponse && !notFound && viewMode === '3D' && (
            <Skyplot3D
              satellites={satellites}
              selectedPrn={selectedPrn}
              onSelect={setSelectedPrn}
              hoverPrn={hoverPrn}
              onHover={setHoverPrn}
              showTrails={showTrails}
            />
          )}

          {skyplotResponse && !notFound && viewMode === '2D' && (
            <svg viewBox={`0 0 ${SKYPLOT_VIEW} ${SKYPLOT_VIEW}`} className="w-full max-w-[520px] aspect-square">
              {ELEVATION_RINGS.map((ring) => (
                <circle
                  key={ring}
                  cx={SKYPLOT_CENTER}
                  cy={SKYPLOT_CENTER}
                  r={210 * (1 - ring / 90)}
                  fill={ring === 0 ? 'rgba(255,255,255,0.02)' : 'none'}
                  stroke="var(--border)"
                  strokeWidth={ring === 0 ? 1.5 : 1}
                />
              ))}
              {ELEVATION_RINGS.filter((r) => r < 90).map((ring) => (
                <text
                  key={`lbl-${ring}`}
                  x={SKYPLOT_CENTER + 4}
                  y={SKYPLOT_CENTER - 210 * (1 - ring / 90) - 4}
                  fontSize="9"
                  fill="var(--text-muted)"
                >
                  {ring}°
                </text>
              ))}

              <line x1={40} y1={SKYPLOT_CENTER} x2={460} y2={SKYPLOT_CENTER} stroke="var(--border)" strokeWidth="1" />
              <line x1={SKYPLOT_CENTER} y1={40} x2={SKYPLOT_CENTER} y2={460} stroke="var(--border)" strokeWidth="1" />
              {elevationMask > 0 && (
                <circle
                  cx={SKYPLOT_CENTER}
                  cy={SKYPLOT_CENTER}
                  r={elevationRingRadius(elevationMask)}
                  fill="none"
                  stroke="var(--warning)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )}
              <text x={SKYPLOT_CENTER} y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-primary)">N</text>
              <text x="478" y={SKYPLOT_CENTER + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-primary)">E</text>
              <text x={SKYPLOT_CENTER} y="484" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-primary)">S</text>
              <text x="22" y={SKYPLOT_CENTER + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-primary)">W</text>

              {showTrails &&
                satellites.map((sat) => {
                  if (sat.trail.length < 2) return null;
                  const pts = sat.trail
                    .filter((p) => p.elevation != null && p.azimuth != null)
                    .map((p) => polarToXY(p.azimuth, p.elevation));
                  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                  return (
                    <path
                      key={`trail-${sat.prn}`}
                      d={d}
                      fill="none"
                      stroke={getConstellationColor(sat.system)}
                      strokeWidth="1"
                      strokeOpacity="0.35"
                    />
                  );
                })}

              {satellites.map((sat) => {
                const { x, y } = polarToXY(sat.azimuth, sat.elevation);
                const color = getConstellationColor(sat.system);
                const selected = sat.prn === selectedPrn;
                return (
                  <g
                    key={sat.prn}
                    onMouseEnter={() => setHoverPrn(sat.prn)}
                    onMouseLeave={() => setHoverPrn((p) => (p === sat.prn ? null : p))}
                    onClick={() => setSelectedPrn(selected ? null : sat.prn)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={x} cy={y} r={selected ? 9 : 6.5} fill={color} stroke={selected ? '#fff' : 'rgba(7,11,20,0.8)'} strokeWidth={selected ? 2.5 : 1.5} />
                    <text x={x + 9} y={y + 3} fontSize={selected ? '11' : '9'} fontFamily="'JetBrains Mono', monospace" fill="var(--text-primary)">
                      {sat.prn}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {viewMode === '2D' && shown && (
            <div className="absolute bottom-2 left-2 bg-panel-raised border border-border rounded-md px-2.5 py-2 text-[11px] leading-tight shadow-panel">
              <p className="font-mono font-semibold text-text-primary">
                {shown.prn} <span className="text-text-muted font-sans font-normal">({shown.system})</span>
                {pinned && <span className="ml-1.5 text-[9px] text-accent font-sans font-semibold uppercase tracking-wide">Pinned</span>}
              </p>
              <p className="text-text-muted">Elev {shown.elevation.toFixed(1)}° &middot; Az {shown.azimuth.toFixed(1)}°</p>
              {shown.snr != null && <p className="text-text-muted">SNR {shown.snr.toFixed(1)} dB-Hz</p>}
              <p className="text-text-muted">{formatLocalTime(shown.time)}</p>
              {shown.quality && <Badge tone={toneForBackendQuality(shown.quality)} className="mt-1">{shown.quality}</Badge>}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
