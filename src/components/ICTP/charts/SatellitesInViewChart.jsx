import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_GRID_COLOR, CHART_TICK, CHART_TOOLTIP_STYLE } from './chartTheme';
import { formatLocalTime } from '../ictp_lib/format';
import "../../../dashboard/Stylesheet/ictp.css";
export default function SatellitesInViewChart({ data, loading, error }) {
  const rows = (data || []).map((d) => ({ time: d.time, count: d.count }));

  return (
    <ChartCard
      title="Satellites in View"
      subtitle="Real time series -- total tracked satellites per sampled epoch"
      loading={loading}
      error={error}
      empty={!rows.length}
      emptyDetail="No timestamped tracking samples yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tickFormatter={formatLocalTime} tick={CHART_TICK} minTickGap={40} />
          <YAxis tick={CHART_TICK} allowDecimals={false} width={28} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelFormatter={formatLocalTime}
            formatter={(value) => [value, 'Satellites']}
          />
          <Line type="monotone" dataKey="count" stroke="#3EA6FF" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          {rows.length > 20 && <Brush dataKey="time" height={18} stroke="#263246" fill="#111B2B" tickFormatter={formatLocalTime} travellerWidth={8} />}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
