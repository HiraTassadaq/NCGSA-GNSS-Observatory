import PerSatelliteBarChart from './PerSatelliteBarChart';
import "../../../dashboard/Stylesheet/ictp.css";
export default function MultipathChart({ satellitesResponse, loading, error }) {
  return (
    <PerSatelliteBarChart
      title="Multipath (MP1 / MP2)"
      subtitle="Current session RMS per satellite"
      satellitesResponse={satellitesResponse}
      series={[
        { key: 'multipath_mp1', label: 'MP1', color: '#3EA6FF' },
        { key: 'multipath_mp2', label: 'MP2', color: '#F4B942' },
      ]}
      unit="m"
      colorByConstellation={false}
      loading={loading}
      error={error}
    />
  );
}
