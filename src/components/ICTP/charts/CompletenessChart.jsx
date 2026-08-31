import PerSatelliteBarChart from './PerSatelliteBarChart';
import "../../../dashboard/Stylesheet/ictp.css";
export default function CompletenessChart({ satellitesResponse, loading, error }) {
  return (
    <PerSatelliteBarChart
      title="Completeness"
      subtitle="Valid epochs as % of expected epochs, current session"
      satellitesResponse={satellitesResponse}
      series={[{ key: 'completeness_pct', label: 'Completeness' }]}
      unit="%"
      loading={loading}
      error={error}
    />
  );
}
