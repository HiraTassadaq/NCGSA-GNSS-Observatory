import { useMemo, useState } from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';
import { LoadingState, ErrorState, EmptyState } from '../common/AsyncStates';
import { useWorldProjection } from '../hooks/useWorldProjection';
import { useOrbits } from '../hooks/useGnssData';
import { formatNumber } from '../ictp_lib/format';

// A simple blue -> cyan -> green -> yellow -> red ramp, same spirit as the
// Septentrio-style TEC map: cool colors for low delay, warm for high delay.
const STOPS = [
  { t: 0, c: [62, 130, 246] },
  { t: 0.25, c: [56, 189, 200] },
  { t: 0.5, c: [53, 208, 127] },
  { t: 0.75, c: [244, 185, 66] },
  { t: 1, c: [255, 90, 101] },
];

function delayColor(norm) {
  const t = Math.max(0, Math.min(1, norm));
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      const f = (t - a.t) / span;
      const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * f);
      const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * f);
      const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * f);
      return `rgb(${r},${g},${bl})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1].c.join(',')})`;
}

export default function IonosphericMap({ satellitesResponse, refetchToken }) {
  const { width, height, landPath, graticulePath, outlinePath, project } = useWorldProjection();
  const { data: orbitsResponse, loading, error } = useOrbits(0, refetchToken);
  const [hoverPrn, setHoverPrn] = useState(null);

  const delayByPrn = useMemo(() => {
    const map = new Map();
    for (const s of satellitesResponse || []) {
      if (s.iono_delay_l1 != null) map.set(s.prn, s.iono_delay_l1);
    }
    return map;
  }, [satellitesResponse]);

  const points = useMemo(() => {
    if (!orbitsResponse?.satellites?.length) return [];
    return orbitsResponse.satellites
      .map((sat) => {
        const path = sat.path || [];
        const last = path[path.length - 1];
        const geo = last ? { lat: last.latitude, lon: last.longitude } : null;
        const delay = delayByPrn.get(sat.prn);
        if (!geo || delay == null || geo.lat == null || geo.lon == null) return null;
        return { prn: sat.prn, lat: geo.lat, lon: geo.lon, delay };
      })
      .filter(Boolean);
  }, [orbitsResponse, delayByPrn]);

  const { min, max } = useMemo(() => {
    if (!points.length) return { min: 0, max: 1 };
    const values = points.map((p) => p.delay);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [points]);

  const hovered = points.find((p) => p.prn === hoverPrn);
  const span = max - min || 1;

  return (
    <Panel
      title="Ionospheric Delay Map"
      subtitle="L1 code-minus-phase estimate by satellite sub-point"
      className="h-full"
      bodyClassName="p-3 flex flex-col gap-2"
      actions={
        error && points.length ? (
          <Badge tone="warning" title={error.message}>Offline · last known data</Badge>
        ) : null
      }
    >
      <div className="relative flex-1 min-h-[240px]">
        {loading && !orbitsResponse && <LoadingState />}
        {/* A failed poll shouldn't hide data we already have -- only fall
            back to the error/empty states when there's nothing to show. */}
        {!points.length && !loading && error && <ErrorState detail={error.message} />}
        {!points.length && !loading && !error && (
          <EmptyState title="No ionospheric data" detail="Needs both orbit positions and per-satellite iono delay for this session." />
        )}

        {Boolean(points.length) && (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <path d={outlinePath} fill="#05070d" stroke="var(--border)" strokeWidth="1" />
            <path d={graticulePath} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
            <path d={landPath} fill="var(--panel-raised)" stroke="var(--border)" strokeWidth="0.6" />

            {points.map((p) => {
              const pt = project(p.lon, p.lat);
              if (!pt) return null;
              const norm = (p.delay - min) / span;
              const color = delayColor(norm);
              return (
                <circle
                  key={p.prn}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverPrn === p.prn ? 7 : 5.5}
                  fill={color}
                  fillOpacity="0.85"
                  stroke="#05070d"
                  strokeWidth="1"
                  onPointerEnter={() => setHoverPrn(p.prn)}
                  onPointerLeave={() => setHoverPrn((prev) => (prev === p.prn ? null : prev))}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </svg>
        )}

        {hovered && (
          <div className="absolute bottom-2 left-2 bg-panel-raised border border-border rounded-md px-2.5 py-2 text-[11px] leading-tight shadow-panel pointer-events-none">
            <p className="font-mono font-semibold text-text-primary">{hovered.prn}</p>
            <p className="text-text-muted">{formatNumber(hovered.delay, 2)} m delay</p>
          </div>
        )}

        {Boolean(points.length) && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-panel-raised border border-border rounded-md px-2 py-1">
            <span className="text-[9px] text-text-muted">{formatNumber(min, 1)}</span>
            <span
              className="h-2 w-20 rounded-full"
              style={{ background: `linear-gradient(90deg, ${STOPS.map((s) => `rgb(${s.c.join(',')})`).join(',')})` }}
            />
            <span className="text-[9px] text-text-muted">{formatNumber(max, 1)} m</span>
          </div>
        )}
      </div>
    </Panel>
  );
}
