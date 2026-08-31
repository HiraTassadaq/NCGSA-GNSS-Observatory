import { Brush, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import { CHART_GRID_COLOR, CHART_TICK, CHART_TOOLTIP_STYLE } from './chartTheme';
import { formatLocalTime } from '../ictp_lib/format';
import "../../../dashboard/Stylesheet/ictp.css";
// One line per DOP type, in the same HDOP -> VDOP -> PDOP -> TDOP -> GDOP
// order used everywhere else on this dashboard (KpiGrid, StationPanel).
const SERIES = [
  { key: 'hdop', label: 'HDOP', color: '#3EA6FF' },
  { key: 'vdop', label: 'VDOP', color: '#9B7BFF' },
  { key: 'pdop', label: 'PDOP', color: '#33D6A6' },
  { key: 'tdop', label: 'TDOP', color: '#FFC24B' },
  { key: 'gdop', label: 'GDOP', color: '#FF6B6B' },
];

export default function DopHistoryChart({ data, loading, error }) {
  const rows = (data || []).map((d) => ({
    time: d.time,
    hdop: d.hdop, vdop: d.vdop, pdop: d.pdop, tdop: d.tdop, gdop: d.gdop,
  }));

  return (
    <ChartCard
      title="DOP Trend"
      subtitle="HDOP / VDOP / PDOP / TDOP / GDOP per epoch across the session -- lower is better"
      loading={loading}
      error={error}
      empty={!rows.length}
      emptyDetail="No timestamped DOP samples yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tickFormatter={formatLocalTime} tick={CHART_TICK} minTickGap={40} />
          <YAxis tick={CHART_TICK} width={28} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelFormatter={formatLocalTime}
            formatter={(value, name) => [value, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#91A0B5' }} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
          {rows.length > 20 && <Brush dataKey="time" height={18} stroke="#263246" fill="#111B2B" tickFormatter={formatLocalTime} travellerWidth={8} />}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
