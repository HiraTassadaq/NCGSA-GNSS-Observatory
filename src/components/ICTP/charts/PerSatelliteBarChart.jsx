import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import { getConstellationColor, normalizeSystemName } from '../constants/constellations';
import { CHART_GRID_COLOR, CHART_TICK, CHART_TOOLTIP_STYLE } from './chartTheme';
import { useSelection } from '../ictp_state/SelectionContext';
import "../../../dashboard/Stylesheet/ictp.css";
/**
 * Shared renderer for every "current session" per-satellite bar chart
 * (SNR, multipath, ionospheric delay, completeness). These values are
 * single session-wide scalars per satellite in the backend (see
 * gnss_backend/app/parser.py) -- NOT a time series -- so this deliberately
 * renders as a comparative bar-per-satellite view rather than a line
 * chart that would misleadingly imply values evolving over time.
 */
export default function PerSatelliteBarChart({ title, subtitle, satellitesResponse, series, unit, loading, error, colorByConstellation = true }) {
  const { selectedPrn, setSelectedPrn } = useSelection();
  const rows = (satellitesResponse || [])
    .filter((s) => series.some((ser) => typeof s[ser.key] === 'number'))
    .sort((a, b) => a.prn.localeCompare(b.prn));

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      empty={!rows.length}
      emptyDetail="No satellites with this measurement in the current session."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} onClick={(state) => {
          const prn = state?.activeLabel;
          if (prn) setSelectedPrn((prev) => (prev === prn ? null : prn));
        }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="prn" tick={{ ...CHART_TICK, fontFamily: 'monospace' }} interval={0} angle={-45} textAnchor="end" height={46} />
          <YAxis tick={CHART_TICK} width={32} unit={unit ? ` ${unit}` : undefined} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value, name) => [`${value} ${unit || ''}`.trim(), name]} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          {series.map((ser) => (
            <Bar key={ser.key} dataKey={ser.key} name={ser.label} fill={ser.color || '#3EA6FF'} radius={[2, 2, 0, 0]} isAnimationActive={false} cursor="pointer">
              {colorByConstellation &&
                rows.map((row) => (
                  <Cell
                    key={row.prn}
                    fill={getConstellationColor(normalizeSystemName(row.system))}
                    fillOpacity={selectedPrn && row.prn !== selectedPrn ? 0.35 : 1}
                  />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
