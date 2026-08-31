import Panel from '../common/Panel';
import Badge from '../common/Badge';
import { LoadingState, EmptyState } from '../common/AsyncStates';
import { dopQualityLabel, STATUS_TONE } from '../constants/thresholds';
import { formatDuration, formatLocalDateTime, formatNumber } from '../ictp_lib/format';

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      {tone ? (
        <Badge tone={tone}>{value}</Badge>
      ) : (
        <span className="text-xs font-medium text-text-primary tabular-nums text-right">{value}</span>
      )}
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-1">{title}</p>
      <div>{children}</div>
    </div>
  );
}

export default function StationPanel({ station, loading, error, dataAgeSeconds, stale }) {
  return (
    <Panel title="Station" subtitle={station?.marker || 'GRAL'}>
      {loading && !station && <LoadingState />}
      {!loading && !station && <EmptyState title="No station data" detail={error?.message || 'Waiting for the first observation file to be processed.'} />}

      {station && (
        <div>
          <div className="mb-3 pb-3 border-b border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-1">Data Source</p>
            <p className="text-xs font-medium text-text-primary">GRAL ICTP GNSS Receiver, NCGSA, IST Islamabad, Pakistan</p>
          </div>

          <Group title="Station">
            <Row label="Latitude" value={station.lat_deg != null ? `${formatNumber(station.lat_deg, 6)}°` : '--'} />
            <Row label="Longitude" value={station.lon_deg != null ? `${formatNumber(station.lon_deg, 6)}°` : '--'} />
            <Row label="Ellipsoidal Height" value={station.height_m != null ? `${formatNumber(station.height_m, 2)} m` : '--'} />
          </Group>

          <Group title="Position (ECEF)">
            <Row label="X" value={`${formatNumber(station.position?.x, 3)} m`} />
            <Row label="Y" value={`${formatNumber(station.position?.y, 3)} m`} />
            <Row label="Z" value={`${formatNumber(station.position?.z, 3)} m`} />
          </Group>

          <Group title="Quality">
            <Row
              label="HDOP"
              value={formatNumber(station.hdop, 2)}
              tone={STATUS_TONE[dopQualityLabel(station.hdop)]}
            />
            <Row
              label="VDOP"
              value={formatNumber(station.vdop, 2)}
              tone={STATUS_TONE[dopQualityLabel(station.vdop)]}
            />
            <Row
              label="PDOP"
              value={formatNumber(station.pdop, 2)}
              tone={STATUS_TONE[dopQualityLabel(station.pdop)]}
            />
            <Row
              label="TDOP"
              value={formatNumber(station.tdop, 2)}
              tone={STATUS_TONE[dopQualityLabel(station.tdop)]}
            />
            <Row
              label="GDOP"
              value={formatNumber(station.gdop, 2)}
              tone={STATUS_TONE[dopQualityLabel(station.gdop)]}
            />
          </Group>

          <Group title="Session">
            <Row label="Start" value={station.session_start ? formatLocalDateTime(station.session_start) : '--'} />
            <Row label="End" value={station.session_end ? formatLocalDateTime(station.session_end) : '--'} />
            <Row
              label="Data Freshness"
              value={dataAgeSeconds != null ? `${formatDuration(dataAgeSeconds)} ago` : '--'}
              tone={stale ? 'warning' : dataAgeSeconds != null ? 'success' : undefined}
            />
          </Group>

          <Group title="Equipment">
            <Row label="Receiver" value={station.receiver || '--'} />
            <Row label="Antenna" value={station.antenna || '--'} />
          </Group>
        </div>
      )}
    </Panel>
  );
}
