import { useMemo } from 'react';
import { Area, AreaChart, Brush, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import { CONSTELLATIONS, getConstellationColor } from '../constants/constellations';
import { constellationCountsOverTime } from '../ictp_lib/selectors';
import { CHART_GRID_COLOR, CHART_TICK, CHART_TOOLTIP_STYLE } from './chartTheme';
import { formatLocalTime } from '../ictp_lib/format';
import "../../../dashboard/Stylesheet/ictp.css";
export default function ConstellationCountChart({ skyplotResponse, loading, error }) {
  const rows = useMemo(() => constellationCountsOverTime(skyplotResponse), [skyplotResponse]);
  const present = CONSTELLATIONS.filter((sys) => rows.some((r) => r[sys]));

  return (
    <ChartCard
      title="Satellites by Constellation"
      subtitle="Real per-epoch counts derived from sky-plot samples"
      loading={loading}
      error={error}
      empty={!rows.length}
      emptyDetail="No timestamped tracking samples yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tickFormatter={formatLocalTime} tick={CHART_TICK} minTickGap={40} />
          <YAxis tick={CHART_TICK} allowDecimals={false} width={28} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelFormatter={formatLocalTime} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {present.map((sys) => (
            <Area
              key={sys}
              type="monotone"
              dataKey={sys}
              stackId="1"
              stroke={getConstellationColor(sys)}
              fill={getConstellationColor(sys)}
              fillOpacity={0.35}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}
          {rows.length > 20 && <Brush dataKey="time" height={18} stroke="#263246" fill="#111B2B" tickFormatter={formatLocalTime} travellerWidth={8} />}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
