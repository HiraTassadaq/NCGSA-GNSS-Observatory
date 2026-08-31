import PerSatelliteBarChart from './PerSatelliteBarChart';
import "../../../dashboard/Stylesheet/ictp.css";
export default function SnrChart({ satellitesResponse, loading, error }) {
  return (
    <PerSatelliteBarChart
      title="Signal-to-Noise Ratio"
      subtitle="Current session average per satellite, colored by constellation"
      satellitesResponse={satellitesResponse}
      series={[{ key: 'avg_snr', label: 'Avg SNR' }]}
      unit="dB-Hz"
      loading={loading}
      error={error}
    />
  );
}
