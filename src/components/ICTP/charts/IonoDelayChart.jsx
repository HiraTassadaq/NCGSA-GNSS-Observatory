import PerSatelliteBarChart from './PerSatelliteBarChart';
import "../../../dashboard/Stylesheet/ictp.css";
export default function IonoDelayChart({ satellitesResponse, loading, error }) {
  return (
    <PerSatelliteBarChart
      title="Ionospheric Delay (L1)"
      subtitle="Session-mean code-minus-phase estimate per satellite, not a Klobuchar/TEC model"
      satellitesResponse={satellitesResponse}
      series={[{ key: 'iono_delay_l1', label: 'Iono Delay L1' }]}
      unit="m"
      loading={loading}
      error={error}
    />
  );
}
