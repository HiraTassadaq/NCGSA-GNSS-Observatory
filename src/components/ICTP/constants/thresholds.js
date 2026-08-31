// Quality-band thresholds used ONLY where the backend does not already
// classify a value. Per-satellite `quality` (Excellent/Good/Partial/Poor)
// comes straight from the backend's own quality_label() -- based on
// completeness_pct, see gnss_backend/app/parser.py -- and is never
// re-derived here.
//
// The bands below are for values the backend leaves as raw numbers
// (average SNR, PDOP/VDOP/GDOP) but this dashboard still needs to render
// as a status label (KPI cards, alerts). They are documented, conventional
// GNSS industry bands, not something invented for this UI:
//   - SNR (dB-Hz): widely used receiver/App-note convention (e.g. u-blox,
//     RTKLIB community guidance) for L-band C/N0 quality.
//   - DOP: the classic DOP quality table published by GPS.gov
//     ("Dilution of Precision" reference, <1 ideal ... >20 poor).
// If the backend ever exposes its own SNR/DOP classification, prefer that
// over these bands.

export const SNR_BANDS = [
  { max: Infinity, min: 45, label: 'Excellent' },
  { max: 45, min: 35, label: 'Good' },
  { max: 35, min: 25, label: 'Moderate' },
  { max: 25, min: -Infinity, label: 'Poor' },
];

export const DOP_BANDS = [
  { max: 2, min: -Infinity, label: 'Excellent' },
  { max: 5, min: 2, label: 'Good' },
  { max: 10, min: 5, label: 'Moderate' },
  { max: Infinity, min: 10, label: 'Poor' },
];

function bandLabel(bands, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Unavailable';
  const band = bands.find((b) => value >= b.min && value < b.max);
  return band ? band.label : 'Unavailable';
}

export const snrQualityLabel = (avgSnr) => bandLabel(SNR_BANDS, avgSnr);
export const dopQualityLabel = (dop) => bandLabel(DOP_BANDS, dop);

export const STATUS_TONE = {
  Excellent: 'success',
  Good: 'success',
  Moderate: 'warning',
  Poor: 'danger',
  Unavailable: 'muted',
};

// Backend's exact per-satellite quality strings (parser.py quality_label())
// mapped down to a tone for badges -- string match on prefix since
// "Partial (rise/set or blocked)" and "Poor / low elevation" carry
// parenthetical detail we still want to display verbatim.
export function toneForBackendQuality(quality) {
  if (!quality) return 'muted';
  if (quality.startsWith('Excellent')) return 'success';
  if (quality.startsWith('Good')) return 'success';
  if (quality.startsWith('Partial')) return 'warning';
  if (quality.startsWith('Poor')) return 'danger';
  return 'muted';
}
