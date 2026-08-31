import { useMemo, useState } from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';
import { LoadingState, ErrorState, EmptyState } from '../common/AsyncStates';
import { useWorldProjection } from '../hooks/useWorldProjection';
import { useOrbits } from '../hooks/useGnssData';
import { useSelection } from '../ictp_state/SelectionContext';
import { CONSTELLATIONS, getConstellationColor, normalizeSystemName, systemFromPrn } from '../constants/constellations';
import { formatLocalTime } from '../ictp_lib/format';

// Splits a lat/lon path into segments wherever it crosses the antimeridian,
// so a satellite's ground track never draws one long line across the whole
// map when its longitude wraps from +180 to -180.
function splitAtAntimeridian(points) {
  const segments = [];
  let current = [];
  for (const p of points) {
    if (current.length && Math.abs(p.lon - current[current.length - 1].lon) > 180) {
      segments.push(current);
      current = [];
    }
    current.push(p);
  }
  if (current.length) segments.push(current);
  return segments;
}

export default function GroundTrackMap({ stationResponse, refetchToken }) {
  const { width, height, landPath, graticulePath, outlinePath, project } = useWorldProjection();
  const { data: orbitsResponse, loading, error } = useOrbits(0, refetchToken);
  const { selectedPrn, setSelectedPrn } = useSelection();
  const [visible, setVisible] = useState(() => new Set(CONSTELLATIONS));
  const [hoverPrn, setHoverPrn] = useState(null);

  const toggle = (sys) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(sys)) next.delete(sys);
      else next.add(sys);
      return next;
    });
  };

  const tracks = useMemo(() => {
    if (!orbitsResponse?.satellites?.length) return [];
    return orbitsResponse.satellites
      .map((sat) => {
        const system = normalizeSystemName(sat.system || systemFromPrn(sat.prn));
        const geoPoints = (sat.path || [])
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => ({ lat: p.latitude, lon: p.longitude, time: p.time }));
        if (!geoPoints.length) return null;
        const current = geoPoints[geoPoints.length - 1];
        return { prn: sat.prn, system, segments: splitAtAntimeridian(geoPoints), current };
      })
      .filter(Boolean);
  }, [orbitsResponse]);

  const stationPoint = stationResponse?.lat_deg != null ? project(stationResponse.lon_deg, stationResponse.lat_deg) : null;
  const hovered = tracks.find((t) => t.prn === hoverPrn);

  return (
    <Panel
      title="2D Orbit Map"
      subtitle="Ground tracks over the current session"
      className="h-full"
      bodyClassName="p-3 flex flex-col gap-2"
      actions={
        error && tracks.length ? (
          <Badge tone="warning" title={error.message}>Offline · last known data</Badge>
        ) : null
      }
    >
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {CONSTELLATIONS.map((sys) => {
          const active = visible.has(sys);
          return (
            <button
              key={sys}
              type="button"
              onClick={() => toggle(sys)}
              className={`h-6 px-2 rounded-md text-[10px] font-semibold tracking-wide border transition-colors ${
                active ? 'text-white' : 'text-text-muted border-border bg-white/5 opacity-50'
              }`}
              style={active ? { background: `${getConstellationColor(sys)}26`, borderColor: `${getConstellationColor(sys)}66`, color: getConstellationColor(sys) } : undefined}
            >
              {sys}
            </button>
          );
        })}
      </div>

      <div className="relative flex-1 min-h-[240px]">
        {loading && !orbitsResponse && <LoadingState />}
        {/* A failed poll shouldn't hide a ground track we already have --
            only fall back to the error/empty states when there's nothing
            on screen yet. */}
        {!orbitsResponse?.satellites?.length && !loading && error && <ErrorState detail={error.message} />}
        {!orbitsResponse?.satellites?.length && !loading && !error && (
          <EmptyState title="No orbit data" detail="Ground tracks need a processed navigation file for this session." />
        )}

        {Boolean(tracks.length) && (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <path d={outlinePath} fill="#05070d" stroke="var(--border)" strokeWidth="1" />
            <path d={graticulePath} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
            <path d={landPath} fill="var(--panel-raised)" stroke="var(--border)" strokeWidth="0.6" />

            {stationPoint && (
              <g>
                <circle cx={stationPoint.x} cy={stationPoint.y} r="4" fill="var(--accent)" stroke="#05070d" strokeWidth="1.2" />
                <text x={stationPoint.x + 6} y={stationPoint.y + 3} fontSize="9" fill="var(--text-primary)">Station</text>
              </g>
            )}

            {tracks
              .filter((t) => visible.has(t.system))
              .map((t) => {
                const color = getConstellationColor(t.system);
                const selected = t.prn === selectedPrn;
                return (
                  <g key={t.prn}>
                    {t.segments.map((seg, i) => {
                      const d = seg
                        .map((p, j) => {
                          const pt = project(p.lon, p.lat);
                          return pt ? `${j === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : '';
                        })
                        .join(' ');
                      return <path key={i} d={d} fill="none" stroke={color} strokeWidth={selected ? 1.6 : 1} opacity={selected ? 0.9 : 0.45} />;
                    })}
                    {(() => {
                      const cp = project(t.current.lon, t.current.lat);
                      if (!cp) return null;
                      return (
                        <g
                          onPointerEnter={() => setHoverPrn(t.prn)}
                          onPointerLeave={() => setHoverPrn((p) => (p === t.prn ? null : p))}
                          onClick={() => setSelectedPrn(selected ? null : t.prn)}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle cx={cp.x} cy={cp.y} r={selected ? 5 : 3.5} fill={color} stroke={selected ? '#fff' : '#05070d'} strokeWidth={selected ? 2 : 1} />
                          {selected && (
                            <text x={cp.x + 6} y={cp.y - 6} fontSize="9" fontFamily="'JetBrains Mono', monospace" fill="var(--text-primary)">
                              {t.prn}
                            </text>
                          )}
                        </g>
                      );
                    })()}
                  </g>
                );
              })}
          </svg>
        )}

        {hovered && (
          <div className="absolute bottom-2 left-2 bg-panel-raised border border-border rounded-md px-2.5 py-2 text-[11px] leading-tight shadow-panel pointer-events-none">
            <p className="font-mono font-semibold text-text-primary">
              {hovered.prn} <span className="text-text-muted font-sans font-normal">({hovered.system})</span>
            </p>
            <p className="text-text-muted">
              {hovered.current.lat.toFixed(2)}&deg;, {hovered.current.lon.toFixed(2)}&deg;
            </p>
            <p className="text-text-muted">{formatLocalTime(hovered.current.time)}</p>
          </div>
        )}
      </div>
    </Panel>
  );
}
