import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const METERS_PER_DEG_LAT = 111320;

export default function PositionErrorPlot({ positionHistory }) {
  const { chartData, rms, domain, unit, unitScale } = useMemo(() => {
    if (positionHistory.length === 0) return { chartData: [], rms: null, domain: [0, 1], unit: "m", unitScale: 1 };
    const ref = positionHistory[0];
    const metersPerDegLon = METERS_PER_DEG_LAT * Math.cos((ref.lat * Math.PI) / 180);

    let sumSq = 0;
    let maxAbs = 0;
    const raw = positionHistory.map((p) => {
      const east = (p.lon - ref.lon) * metersPerDegLon;
      const north = (p.lat - ref.lat) * METERS_PER_DEG_LAT;
      const up = (p.height ?? 0) - (ref.height ?? 0);
      sumSq += east * east + north * north;
      maxAbs = Math.max(maxAbs, Math.abs(east), Math.abs(north), Math.abs(up));
      return { t: p.t, east, north, up };
    });

    // The receiver may genuinely be static (survey/reference antenna), in
    // which case deviations are centimeter/millimeter-scale. Switch units
    // so tiny-but-real variation is still legible instead of reading as a
    // flat line at "0".
    const useMm = maxAbs < 0.05;
    const scale = useMm ? 1000 : 1;
    const unit = useMm ? "mm" : "m";

    const data = raw.map((p) => ({
      time: new Date(p.t || Date.now()).toLocaleTimeString(),
      East: p.east * scale,
      North: p.north * scale,
      Up: p.up * scale,
    }));

    const scaledMax = Math.max(maxAbs * scale, useMm ? 5 : 0.05);
    const pad = scaledMax * 0.25;

    return {
      chartData: data,
      rms: Math.sqrt(sumSq / raw.length),
      domain: [-(scaledMax + pad), scaledMax + pad],
      unit,
      unitScale: scale,
    };
  }, [positionHistory]);

  if (chartData.length === 0) {
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-hairline)" strokeDasharray="2 4" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--text-dim)" }} minTickGap={40} />
            <YAxis
              domain={domain}
              tick={{ fontSize: 9, fill: "var(--text-dim)" }}
              tickFormatter={(v) => v.toFixed(unit === "mm" ? 0 : 2)}
              label={{ value: unit, angle: -90, position: "insideLeft", fontSize: 9, fill: "var(--text-dim)" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-panel-raised)",
                border: "1px solid var(--border-hairline)",
                fontSize: 11,
              }}
              formatter={(v) => `${Number(v).toFixed(unit === "mm" ? 1 : 3)} ${unit}`}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="East" stroke="var(--gps)" dot={false} strokeWidth={1.25} isAnimationActive={false} />
            <Line type="monotone" dataKey="North" stroke="var(--galileo)" dot={false} strokeWidth={1.25} isAnimationActive={false} />
            <Line type="monotone" dataKey="Up" stroke="var(--glonass)" dot={false} strokeWidth={1.25} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-data)", color: "var(--text-dim)", marginTop: 4 }}>
        RMS: {rms != null ? (rms < 0.05 ? `${(rms * 1000).toFixed(1)} mm` : `${rms.toFixed(2)} m`) : "--"} (relative to first fix this session)
      </div>
    </div>
  );
}