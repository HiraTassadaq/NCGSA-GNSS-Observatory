import Badge from '../common/Badge';
import { getConstellationColor } from '../constants/constellations';
import { toneForBackendQuality } from '../constants/thresholds';
import { formatLocalTime, formatNumber } from '../ictp_lib/format';

export default function SelectedSatellitePanel({ satellite, onClose }) {
  if (!satellite) return null;
  const color = getConstellationColor(satellite.constellation);

  return (
    <div className="absolute top-3 right-3 w-64 bg-panel-raised/95 backdrop-blur border border-border rounded-panel shadow-panel p-3.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
          <div className="min-w-0">
            <p className="font-mono font-semibold text-text-primary leading-none">{satellite.prn}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{satellite.constellation}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary text-xs leading-none px-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {satellite.simulated && (
        <Badge tone="warning" className="mt-2">SIMULATED -- not live data</Badge>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs tabular-nums">
        <dt className="text-text-muted">Visibility</dt>
        <dd className="text-right">
          <Badge tone={satellite.visible ? 'success' : 'muted'}>{satellite.visible ? 'Visible' : 'Below horizon'}</Badge>
        </dd>

        <dt className="text-text-muted">Elevation</dt>
        <dd className="text-right text-text-primary">{formatNumber(satellite.elevationDeg, 1)}&deg;</dd>

        <dt className="text-text-muted">Azimuth</dt>
        <dd className="text-right text-text-primary">{formatNumber(satellite.azimuthDeg, 1)}&deg;</dd>

        {typeof satellite.latitude === 'number' && (
          <>
            <dt className="text-text-muted">Sub-point</dt>
            <dd className="text-right text-text-primary">
              {formatNumber(satellite.latitude, 2)}, {formatNumber(satellite.longitude, 2)}
            </dd>
          </>
        )}

        {typeof satellite.altitudeM === 'number' && (
          <>
            <dt className="text-text-muted">Altitude</dt>
            <dd className="text-right text-text-primary">{formatNumber(satellite.altitudeM / 1000, 0)} km</dd>
          </>
        )}

        {satellite.quality && (
          <>
            <dt className="text-text-muted">Quality</dt>
            <dd className="text-right">
              <Badge tone={toneForBackendQuality(satellite.quality)}>{satellite.quality}</Badge>
            </dd>
          </>
        )}

        {satellite.time && (
          <>
            <dt className="text-text-muted">Sample time</dt>
            <dd className="text-right text-text-primary">{formatLocalTime(satellite.time)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
