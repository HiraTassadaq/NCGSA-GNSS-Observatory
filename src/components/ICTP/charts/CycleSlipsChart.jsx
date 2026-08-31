import PerSatelliteBarChart from './PerSatelliteBarChart';
import "../../../dashboard/Stylesheet/ictp.css";
export default function CycleSlipsChart({ satellitesResponse, loading, error }) {
  return (
    <PerSatelliteBarChart
      title="Cycle Slips"
      subtitle="Total detected per satellite, current session"
      satellitesResponse={satellitesResponse}
      series={[{ key: 'cycle_slips', label: 'Cycle Slips' }]}
      unit=""
      loading={loading}
      error={error}
    />
  );
}
