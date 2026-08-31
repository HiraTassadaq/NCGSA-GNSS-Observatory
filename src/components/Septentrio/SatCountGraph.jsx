import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { CONSTELLATION_ORDER, CONSTELLATION_COLOR } from "../../lib/satellites";

export default function SatCountGraph({ history }) {
  if (history.length === 0) {
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
        Waiting for satellite data...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--border-hairline)" strokeDasharray="2 4" />
        <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--text-dim)" }} minTickGap={40} />
        <YAxis tick={{ fontSize: 9, fill: "var(--text-dim)" }} />
        <Tooltip
          contentStyle={{
            background: "var(--bg-panel-raised)",
            border: "1px solid var(--border-hairline)",
            fontSize: 11,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="Total"
          stroke="var(--total)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        {CONSTELLATION_ORDER.map((c) => (
          <Line
            key={c}
            type="monotone"
            dataKey={c}
            stroke={CONSTELLATION_COLOR[c]}
            strokeWidth={1.25}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
