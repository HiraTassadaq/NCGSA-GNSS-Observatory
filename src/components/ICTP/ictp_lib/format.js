// Every timestamp string coming out of the backend is "%Y-%m-%d %H:%M:%S"
// with NO timezone suffix, but always UTC (gnss_backend uses
// datetime.now(timezone.utc) throughout the pipeline). Parse explicitly as
// UTC rather than letting the browser guess local time from a bare string.
export function parseBackendTime(value) {
  if (!value) return null;
  const iso = value.includes('T') ? value : value.replace(' ', 'T');
  const withZone = iso.endsWith('Z') ? iso : `${iso}Z`;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLocalTime(value, opts = {}) {
  const d = value instanceof Date ? value : parseBackendTime(value);
  if (!d) return '--';
  return d.toLocaleTimeString(undefined, { hour12: false, ...opts });
}

export function formatLocalDateTime(value) {
  const d = value instanceof Date ? value : parseBackendTime(value);
  if (!d) return '--';
  return d.toLocaleString(undefined, { hour12: false });
}

// GPS time = UTC + leap-second offset (18s as of 2017-01-01, no further
// leap seconds have been announced since). Displayed alongside local/UTC
// time in the header per the "GPS time when available" requirement.
const GPS_UTC_LEAP_SECONDS = 18;
export function toGpsTime(date) {
  if (!date) return null;
  return new Date(date.getTime() + GPS_UTC_LEAP_SECONDS * 1000);
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '--';
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return Number(value).toFixed(digits);
}
