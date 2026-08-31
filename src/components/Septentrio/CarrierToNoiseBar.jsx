import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  CONSTELLATION_ORDER,
  CONSTELLATION_COLOR,
  classifyConstellation,
  satelliteLabel,
} from "../../lib/satellites";

const CN0_KEYS = ["CN0", "MeanCN0", "CN0_L1"];
const FREQ_KEYS = ["FreqNr", "Freq", "SignalType"];

const FREQ_COLORS = [
  "#3ddc84",
  "#4d9dff",
  "#f4d03f",
  "#ff9d42",
  "#b985ff",
];

function pickFirst(obj, keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined) return obj[k];
  }
  return undefined;
}

export default function CarrierToNoiseBar({ measEpochPayload }) {
  const [activeTab, setActiveTab] = useState("GPS");

  const { chartData, freqKeys } = useMemo(() => {
    const satellites = measEpochPayload?.satellites || [];
    const freqSet = new Set();
    const rows = [];

    for (const sat of satellites) {
      if (typeof sat.SVID !== "number") continue;

      const constellation = classifyConstellation(sat.SVID);

      if (constellation !== activeTab) continue;

      const row = {
        name: satelliteLabel(sat.SVID),
      };

      const signals = sat.signals || [sat];

      signals.forEach((sig, i) => {
        const freq = pickFirst(sig, FREQ_KEYS) ?? `f${i}`;
        const cn0 = pickFirst(sig, CN0_KEYS);

        if (cn0 !== undefined) {
          const key = `F${freq}`;

          freqSet.add(key);
          row[key] = cn0;
        }
      });

      rows.push(row);
    }

    return {
      chartData: rows,
      freqKeys: Array.from(freqSet).sort(),
    };
  }, [measEpochPayload, activeTab]);

  const averages = useMemo(() => {
    const avg = {};

    freqKeys.forEach((key) => {
      const vals = chartData
        .map((r) => r[key])
        .filter((v) => v != null);

      avg[key] = vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : null;
    });

    return avg;
  }, [chartData, freqKeys]);

  return (
    <div className="cn0-chart">

      <div className="cn0-tabs">
        {CONSTELLATION_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setActiveTab(c)}
            className={`cn0-tab ${
              activeTab === c ? "active" : ""
            }`}
            style={{
              "--constellation-color": CONSTELLATION_COLOR[c],
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="cn0-empty">
          No {activeTab} satellites with CN0 data right now.
        </div>
      ) : (
        <div className="cn0-chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 2,
                right: 2,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                stroke="var(--border-hairline)"
                strokeDasharray="2 4"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 8,
                  fill: "var(--text-dim)",
                }}
                tickLine={false}
                axisLine={{
                  stroke: "var(--border-hairline)",
                }}
              />

              <YAxis
                domain={[0, 60]}
                tick={{
                  fontSize: 8,
                  fill: "var(--text-dim)",
                }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: "var(--bg-panel-raised)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "5px",
                  fontSize: 10,
                  padding: "5px 7px",
                }}
                labelStyle={{
                  color: "var(--text-primary)",
                }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: 9,
                  paddingTop: 0,
                  marginTop: 0,
                }}
              />

              {freqKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={FREQ_COLORS[i % FREQ_COLORS.length]}
                  isAnimationActive={false}
                  barSize={8}
                  radius={[2, 2, 0, 0]}
                />
              ))}

              {freqKeys.map((key, i) =>
                averages[key] != null ? (
                  <ReferenceLine
                    key={`avg-${key}`}
                    y={averages[key]}
                    stroke={
                      FREQ_COLORS[i % FREQ_COLORS.length]
                    }
                    strokeDasharray="3 3"
                  />
                ) : null
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}