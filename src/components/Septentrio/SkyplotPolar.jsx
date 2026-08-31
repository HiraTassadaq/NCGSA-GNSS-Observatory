import React from "react";
import { classifyConstellation, CONSTELLATION_COLOR, satelliteLabel, CONSTELLATION_ORDER } from "../../lib/satellites";

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_RADIUS = CENTER - 24;
// What fraction of the square container the plotted circle actually
// occupies -- used to size/center the radar-sweep overlay so it lines up
// exactly with the rings drawn in the SVG, regardless of rendered size.
const CIRCLE_FRACTION = (MAX_RADIUS * 2) / SIZE;

function elevationToRadius(elDeg) {
  return ((90 - elDeg) / 90) * MAX_RADIUS;
}

function azElToXY(azDeg, elDeg) {
  const r = elevationToRadius(elDeg);
  const rad = ((azDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function cssVar(name, fallback) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

export default function SkyplotPolar({ satellites }) {
  const elevationRings = [0, 30, 60];
  const legendConstellations = CONSTELLATION_ORDER.filter((c) =>
    (satellites || []).some((s) => classifyConstellation(s.SVID) === c)
  );

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", height: "100%", aspectRatio: "1 / 1", maxWidth: "100%" }}>
        {/* Radar sweep -- sized/centered to exactly match the plotted circle
            in the SVG below, low-opacity so it never blocks satellite dots */}
        <div
          className="radar-sweep"
          style={{
            position: "absolute",
            top: `${(1 - CIRCLE_FRACTION) * 50}%`,
            left: `${(1 - CIRCLE_FRACTION) * 50}%`,
            width: `${CIRCLE_FRACTION * 100}%`,
            height: `${CIRCLE_FRACTION * 100}%`,
            borderRadius: "50%",
          }}
        />

        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {elevationRings.map((el) => (
            <circle key={el} cx={CENTER} cy={CENTER} r={elevationToRadius(el)} fill="none" stroke="#ffffff" strokeOpacity={0.8} strokeWidth={1.4} />
          ))}
          <line x1={CENTER} y1={CENTER - MAX_RADIUS} x2={CENTER} y2={CENTER + MAX_RADIUS} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1} />
          <line x1={CENTER - MAX_RADIUS} y1={CENTER} x2={CENTER + MAX_RADIUS} y2={CENTER} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1} />

          <text x={CENTER} y={CENTER - MAX_RADIUS - 6} fontSize="11" fill="var(--text-dim)" textAnchor="middle" fontFamily="var(--font-data)">N</text>
          <text x={CENTER + MAX_RADIUS + 10} y={CENTER + 4} fontSize="11" fill="var(--text-dim)" textAnchor="middle" fontFamily="var(--font-data)">E</text>
          <text x={CENTER} y={CENTER + MAX_RADIUS + 16} fontSize="11" fill="var(--text-dim)" textAnchor="middle" fontFamily="var(--font-data)">S</text>
          <text x={CENTER - MAX_RADIUS - 10} y={CENTER + 4} fontSize="11" fill="var(--text-dim)" textAnchor="middle" fontFamily="var(--font-data)">W</text>

          {elevationRings.map((el) => (
            <text key={`label-${el}`} x={CENTER + 4} y={CENTER - elevationToRadius(el) - 2} fontSize="9" fill="var(--text-dim)" fontFamily="var(--font-data)">
              {el}°
            </text>
          ))}

          {(satellites || [])
            .filter((s) => (s.Elevation ?? -1) >= 0)
            .map((s) => {
              const { x, y } = azElToXY(s.Azimuth ?? 0, s.Elevation ?? 0);
              const c = classifyConstellation(s.SVID);
              const color = cssVar(CONSTELLATION_COLOR[c]?.slice(4, -1) || "--text-dim", "#8a97a8");
              return (
                <g key={s.SVID}>
                  <circle cx={x} cy={y} r={4.5} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color}aa)` }} />
                  <text x={x + 7} y={y + 3} fontSize="9" fill={color} fontFamily="var(--font-data)">
                    {satelliteLabel(s.SVID)}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {legendConstellations.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            background: "rgba(6, 10, 19, 0.75)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 6,
            padding: "6px 8px",
          }}
        >
          {legendConstellations.map((c) => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, fontFamily: "var(--font-data)", color: "var(--text-secondary)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: CONSTELLATION_COLOR[c], flexShrink: 0 }} />
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}