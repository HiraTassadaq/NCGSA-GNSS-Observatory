import React, { useMemo } from "react";

const METERS_PER_DEG_LAT = 111320;

export default function PlanimetricPlot({ positionHistory }) {
  const { points, current, ref, ringStepM } = useMemo(() => {
    if (positionHistory.length === 0) return { points: [], current: null, ref: null, ringStepM: 1 };

    const refPoint = positionHistory[0];
    const metersPerDegLon = METERS_PER_DEG_LAT * Math.cos((refPoint.lat * Math.PI) / 180);

    const pts = positionHistory.map((p) => ({
      east: (p.lon - refPoint.lon) * metersPerDegLon,
      north: (p.lat - refPoint.lat) * METERS_PER_DEG_LAT,
    }));

    const maxOffset = Math.max(0.02, ...pts.map((p) => Math.hypot(p.east, p.north)));
    // pick a "nice" ring step so we get ~3-4 rings
    const rawStep = maxOffset / 3;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1;

    return { points: pts, current: pts[pts.length - 1], ref: refPoint, ringStepM: niceStep };
  }, [positionHistory]);

  if (points.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-dim)",
          fontSize: 12,
        }}
      >
        Waiting for PVTGeodetic data...
      </div>
    );
  }

  const size = 260;
  const half = size / 2;
  const maxRingCount = 3;
  const maxRadiusPx = half - 20;
  const scale = maxRadiusPx / (ringStepM * maxRingCount);

  const toPx = (east, north) => ({
    x: half + east * scale,
    y: half - north * scale, // screen y grows downward, north should go up
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", flex: 1, minHeight: 0 }}>
        {/* range rings */}
        {Array.from({ length: maxRingCount }).map((_, i) => {
          const r = (i + 1) * ringStepM * scale;
          return (
            <circle
              key={i}
              cx={half}
              cy={half}
              r={r}
              fill="none"
              stroke="var(--border-hairline)"
              strokeWidth={1}
            />
          );
        })}
        {/* crosshair */}
        <line x1={half} y1={10} x2={half} y2={size - 10} stroke="var(--border-hairline)" strokeWidth={1} />
        <line x1={10} y1={half} x2={size - 10} y2={half} stroke="var(--border-hairline)" strokeWidth={1} />

        {/* trail */}
        <polyline
          points={points.map((p) => {
            const { x, y } = toPx(p.east, p.north);
            return `${x},${y}`;
          }).join(" ")}
          fill="none"
          stroke="var(--gps)"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* current position */}
        {current && (
          (() => {
            const { x, y } = toPx(current.east, current.north);
            return <circle cx={x} cy={y} r={4} fill="var(--gps)" />;
          })()
        )}

        {/* ring labels */}
        {Array.from({ length: maxRingCount }).map((_, i) => {
          const r = (i + 1) * ringStepM;
          const label = r >= 1000 ? `${(r / 1000).toFixed(1)} km` : r >= 1 ? `${r.toFixed(r < 10 ? 2 : 0)} m` : `${(r * 100).toFixed(0)} cm`;
          return (
            <text
              key={i}
              x={half + 4}
              y={half - (i + 1) * ringStepM * scale - 2}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--font-data)"
            >
              {label}
            </text>
          );
        })}
      </svg>
      {ref && (
        <div style={{ fontSize: 10, fontFamily: "var(--font-data)", color: "var(--text-dim)" }}>
          ref: {ref.lat.toFixed(6)}°N, {ref.lon.toFixed(6)}°E
        </div>
      )}
    </div>
  );
}
